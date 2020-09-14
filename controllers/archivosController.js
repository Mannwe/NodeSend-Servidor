const multer = require('multer')
const shortid = require('shortid')
const fs = require('fs')
const Enlaces = require('../models/Enlace')

exports.subirArchivo = async (req, res, next) => {

    const configuracionMulter = {
        limits : {fileSize: req.usuario ? 1024 * 1024 * 10 : 1024 * 1024}, // Si el usuario está autenticado permitimos subir hasta 10 Mb
        storage: fileStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, __dirname + '/../uploads')
            },
            filename: (req, file, cb) => {
                //const extension = file.mimetype.split('/')[1]
                const extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length)
                cb(null, `${shortid.generate()}${extension}`)
            }
            /* Si no queremos incluir algún tipo de archivos, como pdf
            fileFilter: (req, file, cb) => {
                if(file.mimetype === 'application/pdf'){
                    return cb(null, true)
                }
            }
            */
        })
    }

    const upload = multer(configuracionMulter).single('archivo')

    upload(req, res, async(error) => {
        if(!error){
            res.json({archivo: req.file.filename})
        }else{
            console.log(error)
            return next()
        }
    })
}

exports.eliminarArchivo = async (req, res, next) => {
    console.log('archivo', req.archivo)
    try {
        fs.unlinkSync(__dirname + `/../uploads/${req.archivo}`)
        console.log('Archivo eliminado')
    } catch (error) {
        console.log(error)
    }
}

// Descarga un archivo
exports.descargar = async (req, res, next) => {

    // Obtiene el enlace
    const {archivo} = req.params
    const enlace = await Enlaces.findOne({nombre: archivo})

    const archivoDescarga = __dirname + '/../uploads/' + archivo
    res.download(archivoDescarga)

    // Eliminar el archivo y la entrada de la bbdd
    // Si las descargas son iguales a 1 - Borrar la entrada y borrar el archivo
    const {descargas, nombre} = enlace

    if(descargas === 1){
        // Eliminar el archivo
        req.archivo = nombre
        
        // Eliminar la entrada de la base de datos
        await Enlaces.findOneAndRemove(enlace.id)
        next()
    }else{
        // Si las descargas son mayores a 1 - Restar 1 a las descargas
        enlace.descargas--
        await enlace.save()
    }
}


