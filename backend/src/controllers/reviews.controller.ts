import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as reviewsService from '../services/reviews.service';

const createReviewSchema = z.object({
  stars:   z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { stars, comment } = createReviewSchema.parse(req.body);
    const review = await reviewsService.createReview({
      productId: req.params.productId,
      userId:    req.user!.userId,
      stars,
      comment,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export async function listByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await reviewsService.getProductReviews(req.params.productId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}
