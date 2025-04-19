export function loadBase64Image(base64Encoded, format = "image/png") {

    const base64Data = `data:${format};base64,${base64Encoded}`;

    const img = new Image();
    img.src = base64Data;

    document.body.appendChild(img); // shows the image

    return img;

}