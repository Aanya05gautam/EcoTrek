import multer from 'multer';
import path from 'path';
import fs from 'fs';
const dir=path.resolve('uploads'); fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:dir,filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_'))});
export default multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>cb(null,/^image\//.test(file.mimetype))});
