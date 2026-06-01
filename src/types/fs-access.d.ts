interface ShowDirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
}

interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  queryPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
  requestPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
}

interface Window {
  showDirectoryPicker(
    options?: ShowDirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>;
}
