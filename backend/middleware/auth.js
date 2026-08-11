import jwt from 'jsonwebtoken';
export function auth(req,res,next){
  const token=(req.headers.authorization||'').replace('Bearer ','');
  if(!token) return res.status(401).json({message:'Authentication required'});
  try { req.user=jwt.verify(token,process.env.JWT_SECRET||'dev_secret'); next(); }
  catch { res.status(401).json({message:'Invalid token'}); }
}
export function adminOnly(req,res,next){ if(req.user?.role!=='Admin') return res.status(403).json({message:'Admin access required'}); next(); }
