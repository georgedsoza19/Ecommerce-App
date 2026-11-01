import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CategoriesService } from './categories.service';

class CategoryBody {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get('categories')
  listPublic() {
    return this.categoriesService.listPublic();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/categories')
  listAdmin() {
    return this.categoriesService.listAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/categories')
  create(@Body() dto: CategoryBody) {
    return this.categoriesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/categories/:id')
  update(@Param('id') id: string, @Body() dto: CategoryBody) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/categories/:id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
