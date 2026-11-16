import { Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InventoryDemoService } from './inventory-demo.service';

@Controller('inventory/demo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BARISTA, Role.MANAGER, Role.ADMIN)
export class InventoryDemoController {
  constructor(private readonly demoService: InventoryDemoService) {}

  @Post('test-d-simulation')
  runTestDSimulation() {
    return this.demoService.runTestDSimulation();
  }
}
