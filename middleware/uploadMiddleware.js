const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer (almacenamiento en memoria)
const storage = multer.memoryStorage();

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WEBP).'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    }
});

// Función para subir imagen a Cloudinary
const uploadToCloudinary = async (fileBuffer, folder = 'payments') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `giveapp/${folder}`,
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño
                    { quality: 'auto:good' }, // Optimizar calidad
                    { fetch_format: 'auto' } // Formato óptimo
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

// Función para subir imagen desde base64 a Cloudinary
const uploadBase64ToCloudinary = async (base64String, folder = 'payments') => {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder: `giveapp/${folder}`,
            resource_type: 'image',
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });
        return result;
    } catch (error) {
        throw new Error(`Error al subir imagen: ${error.message}`);
    }
};

// Función para eliminar imagen de Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error al eliminar imagen de Cloudinary:', error);
        throw error;
    }
};

// Middleware para procesar imagen y subir a Cloudinary
const processAndUpload = (folder = 'payments') => {
    return async (req, res, next) => {
        try {
            // Si viene archivo por multer
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer, folder);
                req.cloudinaryResult = {
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height
                };
            }
            // Si viene imagen en base64 en el body
            else if (req.body.proofImage && req.body.proofImage.startsWith('data:image')) {
                const result = await uploadBase64ToCloudinary(req.body.proofImage, folder);
                req.cloudinaryResult = {
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height
                };
            }
            
            next();
        } catch (error) {
            console.error('Error en processAndUpload:', error);
            return res.status(400).json({ 
                error: error.message || 'Error al procesar la imagen' 
            });
        }
    };
};

module.exports = {
    upload,
    uploadToCloudinary,
    uploadBase64ToCloudinary,
    deleteFromCloudinary,
    processAndUpload,
    cloudinary
};
