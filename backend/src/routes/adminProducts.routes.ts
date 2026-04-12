import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth';
import * as ctrl from '../controllers/adminProducts.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.use(requireAdmin);

router.get('/',                      ctrl.list);
router.get('/:id',                   ctrl.getById);
router.post('/',                     ctrl.create);
router.put('/:id',                   ctrl.update);
router.delete('/:id',                ctrl.remove);
router.delete('/:id/permanent',      ctrl.permanentDelete);
router.post('/:id/images',            upload.array('images', 10), ctrl.uploadImages);
router.delete('/:id/images/:imageId', ctrl.deleteImage);

export default router;
