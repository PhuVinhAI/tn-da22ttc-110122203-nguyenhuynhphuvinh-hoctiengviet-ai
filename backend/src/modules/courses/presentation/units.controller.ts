import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from '../application/units.service';
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateUnitDto } from '../dto/units/create-unit.dto';

@ApiTags('Units')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Public()
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Lấy danh sách units theo course' })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.unitsService.findByCourseId(courseId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết unit' })
  async findOne(@Param('id') id: string) {
    return this.unitsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo unit mới' })
  async create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật unit' })
  async update(@Param('id') id: string, @Body() updateUnitDto: Partial<CreateUnitDto>) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa unit' })
  async remove(@Param('id') id: string) {
    return this.unitsService.delete(id);
  }
}
