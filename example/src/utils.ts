export const getImageSize = async (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
            });
        };
        img.onerror = () => {
            resolve({
                width: 200,
                height: 200
            })
        };
        img.src = URL.createObjectURL(file);
    });
};