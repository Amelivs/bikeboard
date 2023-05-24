export class DownloadUtils {

  /**
   * Download a file using either the Web Share API or the HTML download attribute.
   *
   * @param data
   * @param fileName
   */
  static async download(data: Blob, fileName: string) {
    let shareData = {
      files: [new File([data], fileName, { type: data.type })]
    };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      }
      catch (err) {
        if (err instanceof DOMException && err.name !== 'AbortError') {
          this.downloadByLink(data, fileName);
        }
      }
    }
    else {
      this.downloadByLink(data, fileName);
    }
  }

  private static downloadByLink(data: Blob, fileName: string) {
    let url = URL.createObjectURL(data);
    let a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
