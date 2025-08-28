import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface FileUploadProps {
  onUploadSuccess: (fileData: FileData) => void;
  onUploadError: (error: string) => void;
  accept?: 'image' | 'document' | 'any';
  maxSize?: number; // in bytes
  className?: string;
}

interface FileData {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
}

export function FileUpload({ 
  onUploadSuccess, 
  onUploadError, 
  accept = 'image',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);

  const getUploadEndpoint = () => {
    switch (accept) {
      case 'image':
        return '/api/upload/image';
      case 'document':
        return '/api/upload/document';
      case 'any':
        return '/api/upload/any';
      default:
        return '/api/upload/image';
    }
  };

  const getAcceptedTypes = (): any => {
    switch (accept) {
      case 'image':
        return {
          'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        };
      case 'document':
        return {
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'text/plain': ['.txt']
        };
      case 'any':
        return undefined;
      default:
        return {
          'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        };
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadedFile(response);
          onUploadSuccess(response);
          setProgress(100);
        } else {
          const error = JSON.parse(xhr.responseText);
          onUploadError(error.message || 'Upload failed');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        onUploadError('Upload failed');
        setUploading(false);
      });

      xhr.open('POST', getUploadEndpoint());
      xhr.send(formData);
    } catch (error) {
      onUploadError('Upload failed');
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    maxSize,
    multiple: false
  });

  const removeFile = () => {
    if (uploadedFile) {
      // Optionally delete from server
      fetch(`/api/upload/${uploadedFile.filename}`, {
        method: 'DELETE',
        credentials: 'include'
      }).catch(console.error);
    }
    setUploadedFile(null);
    setProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    if (uploadedFile) {
      return uploadedFile.mimetype.startsWith('image/') ? <Image className="w-6 h-6" /> : <File className="w-6 h-6" />;
    }
    return <Upload className="w-6 h-6" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            {getIcon()}
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <div>
                  <p>Drag & drop a file here, or click to select</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {accept === 'image' && 'Images only (JPEG, PNG, GIF, WebP)'}
                    {accept === 'document' && 'Documents only (PDF, DOC, DOCX, TXT)'}
                    {accept === 'any' && 'Any file type'}
                    {` • Max size: ${formatFileSize(maxSize)}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <div>
                <p className="font-medium text-sm">{uploadedFile.originalName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {isDragReject && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>File type not supported</span>
        </div>
      )}
    </div>
  );
} 