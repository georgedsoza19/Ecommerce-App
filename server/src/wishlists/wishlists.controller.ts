import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { WishlistsService } from './wishlists.service';

class AddWishlistDto {
  @IsString()
  productId: string;
}

@Controller('wishlist')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.wishlistsService.list(user.userId);
  }

  @Post()
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistDto) {
    return this.wishlistsService.add(user.userId, dto.productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.remove(user.userId, productId);
  }
}
