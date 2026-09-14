<?php
namespace TechStore\Helpers;

/**
 * File Upload Helper for handling uploads
 */
class FileUploader
{
    private string $uploadDir;
    private array $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private int $maxSize = 5 * 1024 * 1024; // 5MB

    public function __construct(?string $relativePath = null)
    {
        if ($relativePath !== null) {
            $this->uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/public/' . ltrim($relativePath, '/');
        } else {
            $this->uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/public/uploads';
        }
        
        // Create directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    /**
     * Upload file
     */
    public function upload(array $file, ?string $newFilename = null): string|false
    {
        if (!isset($file['error']) || is_array($file['error'])) {
            return false;
        }

        // Check error code
        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                return false;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return false;
            default:
                return false;
        }

        // Validate file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $this->allowedTypes)) {
            return false;
        }

        // Validate size
        if ($file['size'] > $this->maxSize) {
            return false;
        }

        // Generate filename
        if ($newFilename === null) {
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $newFilename = uniqid('upload_', true) . '.' . $extension;
        }

        $targetPath = $this->uploadDir . '/' . $newFilename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            return false;
        }

        return $newFilename;
    }

    /**
     * Delete file
     */
    public function delete(string $filename): bool
    {
        $path = $this->uploadDir . '/' . $filename;
        
        if (file_exists($path)) {
            return unlink($path);
        }
        
        return false;
    }

    /**
     * Check if file exists
     */
    public function exists(string $filename): bool
    {
        return file_exists($this->uploadDir . '/' . $filename);
    }

    /**
     * Get relative path
     */
    public function getRelativePath(string $filename): string
    {
        return 'uploads/' . $filename;
    }

    /**
     * Upload multiple files
     */
    public function uploadMultiple(array $files, ?string $prefix = null): array
    {
        $uploaded = [];
        
        foreach ($files['name'] as $index => $name) {
            $file = [
                'name' => $name,
                'type' => $files['type'][$index],
                'tmp_name' => $files['tmp_name'][$index],
                'size' => $files['size'][$index],
                'error' => $files['error'][$index]
            ];

            $filename = $this->upload($file);
            if ($filename !== false) {
                if ($prefix !== null) {
                    $filename = $prefix . '_' . $filename;
                }
                $uploaded[] = $filename;
            }
        }
        
        return $uploaded;
    }
}