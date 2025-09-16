export const FILE_TYPES = {
  IMAGE: ["png", "jpg", "jpeg", "gif", "webp"],
  VIDEO: ["mp4", "webm", "ogg", "mov"],
} as const;

// Простая функция для определения типа файла
export const getFileType = (src: string): "image" | "video" => {
  const extension = src.split(".").pop()?.toLowerCase();

  if (
    extension &&
    FILE_TYPES.VIDEO.includes(extension as (typeof FILE_TYPES.VIDEO)[number])
  ) {
    return "video";
  }

  return "image"; // по умолчанию считаем изображением
};
