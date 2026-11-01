import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ProductsService } from './products.service';

class ProductImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ProductBody {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtCents?: number | null;

  @IsString()
  @MinLength(2)
  sku: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get('products')
  list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('featured') featured?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.list({
      q,
      category,
      minPrice: minPrice != null ? Number(minPrice) : undefined,
      maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
      inStock: inStock === 'true' || inStock === '1',
      featured: featured === 'true' || featured === '1',
      sort,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
  }

  @Public()
  @Get('products/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/products')
  listAdmin(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.list(
      {
        q,
        category,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sort,
      },
      true,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/products/:id')
  getAdmin(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/products')
  create(@Body() dto: ProductBody) {
    return this.productsService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/products/:id')
  update(@Param('id') id: string, @Body() dto: Partial<ProductBody>) {
    return this.productsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/products/:id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
