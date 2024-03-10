import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PayExpenseDto } from './dto/pay-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req) {
    return this.expensesService.create(createExpenseDto, req.user._id);
  }

  @Get('single')
  allSingle(@Req() req, @Query() qs) {
    return this.expensesService.allSingle(req.user._id, qs.competence, qs);
  }

  @Get('fixed')
  allFixed(@Req() req, @Query() qs) {
    return this.expensesService.allFixed(req.user._id, qs.competence, qs);
  }

  @Get('/resume')
  resume(@Req() req, @Query('competence') comptence: string) {
    return this.expensesService.resume(req.user._id, comptence);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.expensesService.findOne(id, req.user._id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, req.user._id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.expensesService.remove(id, req.user._id);
  }

  @Post('/import-file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'csv' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.expensesService.uploadFile(req.user._id, file);
  }

  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Req() req,
    @Body() payExpenseDto: PayExpenseDto,
  ) {
    return this.expensesService.pay(id, req.user._id, payExpenseDto.competence);
  }
}
