import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { OrdersService } from './orders.service';
import { OrderStatus } from './schemas/order.schema';

class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('orders')
  listMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.listMine(user.userId);
  }

  @Get('orders/:id')
  getMine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getMine(user.userId, id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/orders')
  listAdmin(@Query('status') status?: string) {
    return this.ordersService.listAdmin(status);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/orders/:id')
  getAdmin(@Param('id') id: string) {
    return this.ordersService.getAdmin(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
