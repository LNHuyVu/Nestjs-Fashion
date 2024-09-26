import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from 'src/shared/middleware/role.decorators';
import { userTypes } from 'src/shared/schema/users';
import { GetProductQueryDto } from './dto/get-product-query-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import config from 'config';
import { ProductSkuDto, ProductSkuDtoArr } from './dto/product-sku.dto';
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(201)
  @Roles(userTypes.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.createProduct(createProductDto);
  }

  @Get()
  findAll(@Query() query: GetProductQueryDto) {
    return this.productsService.findAllProduct(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneProduct(id);
  }

  @Patch(':id')
  @Roles(userTypes.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: CreateProductDto,
  ) {
    return await this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productsService.removeProduct(id);
  }

  @Post('/:id/images')
  @Roles(userTypes.ADMIN)
  @UseInterceptors(
    FileInterceptor('productImage', {
      dest: './uploads',
      limits: {
        fileSize: 3145728, //3MMB
      },
    }),
  )
  async uploadPoductImage(
    @Param('id') id: string,
    @UploadedFile() file: ParameterDecorator,
  ) {
    return await this.productsService.uploadProductImage(id, file);
  }

  @Post('/:productId/skus')
  @Roles(userTypes.ADMIN)
  async updateProductSku(
    @Param('productId') productId: string,
    @Body() UpdateProductDto: ProductSkuDtoArr,
  ) {
    return await this.productsService.updateProductSku(
      productId,
      UpdateProductDto,
    );
  }

  @Put('/:productId/skus/:skuId')
  @Roles(userTypes.ADMIN)
  async updateProductSkuById(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body() updateProductSkuDto: ProductSkuDto,
  ) {
    return await this.productsService.updateProductSkuById(
      productId,
      skuId,
      updateProductSkuDto,
    );
  }

  //
  @Post('/:productId/skus/:skuId/licenses')
  @Roles(userTypes.ADMIN)
  async addProductSkuLicense(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body('license') licenseKey: string,
  ) {
    return await this.productsService.addProductSkuLicense(
      productId,
      skuId,
      licenseKey,
    );
  }

  //
  @Delete('/licenses/:licensKeyId')
  @Roles(userTypes.ADMIN)
  async removeProductSkuLicense(@Body('licensKeyId') licenseId: string) {
    return await this.productsService.removeProductSkuLicense(licenseId);
  }
  //
  @Get('/:productId/skus/:skuId/:licenses')
  @Roles(userTypes.ADMIN)
  async getProductSkuLicenses(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.productsService.getProductSkuLicenese(productId, skuId);
  }
  //
  @Put('/:productId/skus/:skuId/licenses/:licenseKeyId')
  @Roles(userTypes.ADMIN)
  async updateProductSkuLicense(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Param('licenseKeyId') licenseKeyId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.productsService.updateProductSkuLicense(
      productId,
      skuId,
      licenseKeyId,
      licenseKey,
    );
  }
}
