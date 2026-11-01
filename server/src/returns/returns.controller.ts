import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ReturnsService } from './returns.service';
import { ReturnStatus } from './schemas/return-request.schema';

class CreateReturnDto {
  @IsString()
  @MinLength(10)
  reason: string;
}

class DecideReturnDto {
  @IsEnum([
    ReturnStatus.APPROVED,
    ReturnStatus.REJECTED,
    ReturnStatus.REFUNDED,
  ])
  status:
    | ReturnStatus.APPROVED
    | ReturnStatus.REJECTED
    | ReturnStatus.REFUNDED;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

@Controller()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('orders/:id/returns')
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.returnsService.create(user.userId, id, dto.reason);
  }

  @Get('account/returns')
  listMine(@CurrentUser() user: AuthUser) {
    return this.returnsService.listMine(user.userId);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/returns')
  listAdmin(@Query('status') status?: string) {
    return this.returnsService.listAdmin(status);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/returns/:id')
  decide(@Param('id') id: string, @Body() dto: DecideReturnDto) {
    return this.returnsService.decide(id, dto.status, dto.adminNote);
  }
}
