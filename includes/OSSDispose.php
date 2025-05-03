<?php
namespace Avatar;
require 'vendor/autoload.php';

use MediaWiki\MediaWikiServices;

use Aws\S3\S3Client;

/**
 * AvatarS3
 * 
 * 为Avatar拓展提供OSS的支持
 */
class OSSdispose {

    /**
     * 获取OSS的配置参数
     */
    public static function credentials() {
        $config =  MediaWikiServices::getInstance()->getMainConfig();
        $AvatarConfig = $config -> get('AvatarS3Config');

        $checks = [
            'region',
            'endpoint',
            'bucket',
            'credentials.key',
            'credentials.secret',
        ];

        $checkResults = self::validateConfig($checks, $AvatarConfig);
        if ($checkResults) return [
            'code' => 1,
            'msg' => $checkResults,
        ];

        $clientParameters = [
            'version' => 'latest',
            'region'  => $AvatarConfig['region'],
            'endpoint' => $AvatarConfig['endpoint'],
            'signature_version' => 'v4',
            'credentials' => [
                'key'    => isset($AvatarConfig['credentials']['key']) ? $AvatarConfig['credentials']['key'] : '',
                'secret' => isset($AvatarConfig['credentials']['secret']) ? $AvatarConfig['credentials']['secret'] : '',
                'token'  => isset($AvatarConfig['credentials']['token']) ? $AvatarConfig['credentials']['token'] : '',
            ]
        ];
        return $clientParameters;
    }

    /**
     * 初始化OSS的客户端
     * 
     * @return S3Client
     */
    public static function init() {
        $s3 = null;
        $AvatarS3Config = self::credentials();
        if (isset($AvatarS3Config['code'])) {
            throw new \Exception(wfMessage('oss-Invalid-init-param') -> text() . json_encode($AvatarS3Config['msg']));
        }
        if(!$s3) {
            $s3 = new S3Client($AvatarS3Config);
        }
        return $s3;
    }

    /**
     * 为Avatar拓展替拱获取OSS的文件路径
     * 
     * @param int $userID
     * @param string $FileName
     * @return string
     */
    public static function getOssImgUrl($userID, $FileName): string {
        $config =  MediaWikiServices::getInstance()->getMainConfig();
        return $config -> get('AvatarS3URL') . '/' . $config -> get('AvatarS3Path') . '/' . $userID . '/' . $FileName . '.png';
    }

    /**
     * 为Avatar拓展替拱上传OSS的功能
     * 
     * @param string $FileBinaryData
     * @param int $userID
     * @param string $file
     * @return 
     */
    public static function submitOSS($FileBinaryData, $userID, $FileName = 'original') {
        if (!$FileBinaryData) return [
            'code' => 1,
            'msg' => wfMessage( 'avatar-notuploaded' )->text(),
        ];

        $config =  MediaWikiServices::getInstance()->getMainConfig();
        try {
            $s3 = self::init();
        } catch (\Exception $e) {
            return [
                'code' => 1,
                'msg' => $e->getMessage(),
            ];
        }

        $AvatarConfig = $config -> get('AvatarS3Config');

        try {
            $s3->putObject([
                'Bucket' => $AvatarConfig['bucket'],
                'Key'    => $config->get('AvatarS3Path') . '/' . $userID . '/' . $FileName . '.png',
                'Body'   => $FileBinaryData,
                'ACL'    => 'public-read',
                'ContentType' => 'image/png',
            ]);

            return [
                'code' => 0,
                'msg' => '',
            ];
        } catch (\Aws\S3\Exception\S3Exception $e) {
            return [
                'code' => 1,
                'msg' => $e->getMessage(),
            ];
        }
    }

    /**
     * 删除OSS上的旧缩略图
     * 
     * @param mixed $userID
     * @return array{code: int, msg: string}
     */
    public static function deleteOSS(int $userID, bool $deleteAll = false) {
        global $wgDefaultAvatarRes;
        $config =  MediaWikiServices::getInstance()->getMainConfig();
        $AvatarConfig = $config -> get('AvatarS3Config');

        $prefix = $config->get('AvatarS3Path') . '/' . $userID . '/';
        $whitelistList = [
            $prefix . 'original.png',
            $prefix . $wgDefaultAvatarRes . '.png',
        ];
        try {
            $s3 = self::init();
        } catch (\Exception $e) {
            return [
                'code' => 1,
                'msg' => $e->getMessage(),
            ];
        }
        $objects = $s3->getPaginator('ListObjects', [
            'Bucket' => $AvatarConfig['bucket'],
            'Prefix' => $prefix,
        ]);

        foreach ($objects as $result) {
            foreach ($result['Contents'] as $object) {
                $key = $object['Key'];
                if (!$deleteAll && in_array($key, $whitelistList)) {
                    continue;
                }
                $s3->deleteObject([
                    'Bucket' => $AvatarConfig['bucket'],
                    'Key' => $key,
                ]);
            }
        }
        return [
            'code' => 0,
            'msg' => '',
        ];
    }

    /**
     * 获取OSS上的图片二进制数据
     * @param string $userID
     * @param string $FileName
     * @return array{code: int, msg: string}}
     */
    public static function getImgBinData(int $userID, string $FileName = 'original') {
        $config =  MediaWikiServices::getInstance()->getMainConfig();
        $AvatarConfig = $config -> get('AvatarS3Config');

        $key = $config->get('AvatarS3Path') . '/' . $userID . '/' . $FileName . '.png';

        try {
            $s3 = self::init();
        } catch (\Exception $e) {
            return [
                'code' => 1,
                'msg' => $e->getMessage(),
            ];
        }
        try {
            $result = $s3->getObject([
                'Bucket' => $AvatarConfig['bucket'],
                'Key'    => $key,
            ]);

            $binaryData = $result['Body']->getContents();
            return [
                'code' => 0,
                'msg' => $binaryData,
            ];

        } catch (\Aws\S3\Exception\S3Exception $e) {
            return [
                'code' => 1,
                'msg' => $e->getMessage(),
            ];
        }
    }

    /**
     * 获取文件是否存在
     * @param mixed $userID
     * @param mixed $FileName
     * @return array{code: int, msg: string}
     */
    public static function CheckFileExist($userID, $FileName) {
        $config =  MediaWikiServices::getInstance()->getMainConfig();
        $AvatarConfig = $config -> get('AvatarS3Config');

        $key = $config->get('AvatarS3Path') . '/' . $userID . '/' . $FileName . '.png';

        try {
            $s3 = self::init();
        } catch (\Exception $e) {
            return [
                'code' => 1,
                'msg' => $e->getMessage(),
            ];
        }
        try {
            $s3->headObject([
                'Bucket' => $AvatarConfig['bucket'],
                'Key' => $key,
            ]);
        
            return [
                'code' => 0,
                'msg' => '',
            ];
        } catch (\Aws\S3\Exception\S3Exception $e) {
            if ($e->getStatusCode() === 404 || $s3->isNoSuchKeyException($e)) {
                return  [
                    'code' => 2,
                    'msg' => '',
                ];
            } else {
                return [
                    'code' => 1,
                    'msg' => 'error',
                ];
            }
        }
    }

    // 工具函数
    private static function checkConfigKey(?string $value, string $errorMessage): ?string
    {
        if ($value === null || $value === '') {
            return $errorMessage;
        }
        return null;
    }

    private static function getConfigValue(array $config, string $keyPath, $default = null) {
        $keys = explode('.', $keyPath);
        foreach ($keys as $key) {
            if (!isset($config[$key])) {
                return $default;
            }
            $config = $config[$key];
        }
        return $config;
    }

    private static function validateConfig(array $array, array $AvatarConfig) {
        $errors = [];
    
        foreach ($array as $keyPath) {
            $value = self::getConfigValue($AvatarConfig, $keyPath);
            $result = self::checkConfigKey($value, $keyPath);
            if ($result) {
                $errors[] = $result;
            }
        }
    
        return $errors ?: null;
    }
}