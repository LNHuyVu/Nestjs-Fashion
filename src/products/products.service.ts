import { Inject, Injectable } from '@nestjs/common';
import { ProductRespository } from 'src/shared/repositories/product.respository';
import { Products, SkuDetails } from 'src/shared/schema/products';
import { CreateProductDto } from './dto/create-product.dto';
import qs2m from 'qs-to-mongo';
import cloudinary from 'cloudinary';
import config from 'config';
import { unlinkSync } from 'fs';
import { ProductSkuDto, ProductSkuDtoArr } from './dto/product-sku.dto';
@Injectable()
export class ProductsService {
  constructor(
    @Inject(ProductRespository) private readonly productDB: ProductRespository,
    // @InjectStripe() private readonly stripeClient: Stripe,
  ) {
    cloudinary.v2.config({
      cloud_name: config.get('cloudinary.cloud_name'),
      api_key: config.get('cloudinary.api_key'),
      api_secret: config.get('cloudinary.api_secret'),
    });
  }

  async createProduct(createProductDto: CreateProductDto): Promise<{
    message: string;
    result: Products;
    success: boolean;
  }> {
    try {
      const createdProductInDB = await this.productDB.create(createProductDto);
      return {
        message: 'Product created successfully',
        result: createdProductInDB,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAllProduct(query: any) {
    try {
      let callForHomePage = false;
      if (query.homepage) {
        callForHomePage = true;
      }
      delete query.homepage;
      const { criteria, options, links } = qs2m(query);
      if (callForHomePage) {
        const products = await this.productDB.findProductWithGroupBy();
        return {
          message:
            products.length > 0
              ? 'Product found successfully'
              : 'Product not found',
          result: products,
          success: true,
        };
      }
      const { totalProductCount, products } = await this.productDB.find(
        criteria,
        options,
      );
      return {
        message:
          products.length > 0
            ? 'Product found successfully'
            : 'Product not found',
        result: {
          metadata: {
            skip: options.skip || 0,
            limit: options.limit || 10,
            total: totalProductCount,
            pages: options.limit
              ? Math.ceil(totalProductCount / options.limit)
              : 1,
            links: links('/', totalProductCount),
          },
          products,
        },
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: CreateProductDto,
  ): Promise<{
    message: string;
    result: Products;
    success: boolean;
  }> {
    try {
      const productExits = await this.productDB.findOne({ _id: id });
      if (!productExits) {
        throw new Error('Product not found ');
      }
      const updateProduct = await this.productDB.findOneAndUpdate(
        { _id: id },
        updateProductDto,
      );
      return {
        message: 'Product updated successfully',
        result: updateProduct,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeProduct(id: string): Promise<{
    message: string;
    result: Products;
    success: boolean;
  }> {
    try {
      const productExits = await this.productDB.findOne({ _id: id });
      if (!productExits) {
        throw new Error('Product not found ');
      }
      await this.productDB.findOneAndDelete({ _id: id });
      return {
        message: 'Product deleted successfully',
        success: true,
        result: null,
      };
    } catch (error) {
      throw error;
    }
  }
  //
  async uploadProductImage(
    id: string,
    file: any,
  ): Promise<{
    message: string;
    success: boolean;
    result: string;
  }> {
    try {
      const product = await this.productDB.findOne({ _id: id });
      if (!product) {
        throw new Error('Product not found');
      }
      if (product.imageDetails?.public_id) {
        await cloudinary.v2.uploader.destroy(product.imageDetails.public_id, {
          invalidate: true,
        });
      }
      const resOfCloudinary = await cloudinary.v2.uploader.upload(file.path, {
        folder: config.get('cloudinary.folderPath'),
        public_id: `${config.get('cloudinary.public_Id_prefix')}${Date.now()}`,
        transformation: [
          {
            width: config.get('cloudinary.bigSize').toString().split('X')[0],
            height: config.get('cloudinary.bigSize').toString().split('X')[1],
            crop: 'fill',
          },
          {
            quality: 'auto',
          },
        ],
      });
      unlinkSync(file.path);
      await this.productDB.findOneAndUpdate(
        { _id: id },
        {
          imageDetails: resOfCloudinary,
          image: resOfCloudinary.secure_url,
        },
      );

      return {
        message: 'Image uploaded successfully',
        success: true,
        result: resOfCloudinary.secure_url,
      };
    } catch (error) {
      throw error;
    }
  }
  async findOneProduct(id: string): Promise<{
    message: string;
    result: { product: Products; relatedProducts: Products[] };
    success: boolean;
  }> {
    try {
      const product: Products = await this.productDB.findOne({ _id: id });
      if (!product) throw new Error(`Product not found`);
      const relatedProducts: Products[] =
        await this.productDB.findRelatedProducts({
          category: product.category,
          _id: { $ne: id },
        });
      return {
        message: 'Product fetched successfully',
        result: {
          product,
          relatedProducts,
        },
        success: true,
      };
    } catch (error) {}
  }
  // This is for create one or miltiple sku for an product
  async updateProductSku(productId: string, data: ProductSkuDtoArr) {
    try {
      const product = await this.productDB.findOne({ _id: productId });
      if (!product) throw new Error(`Product not found`);
      const randomString = Math.random().toString(36).substring(2, 5);
      const timestamp = Date.now();
      const skuCode = parseInt(randomString, 36) * timestamp;
      for (let i = 0; i < data.skuDetails.length; i++) {
        data.skuDetails[i].skuCode = skuCode + '';
      }
      await this.productDB.findOneAndUpdate(
        { _id: productId },
        { $push: { skuDetails: data.skuDetails } },
      );
      return {
        message: 'Product sku updated successfully',
        success: true,
        result: null,
      };
    } catch (error) {
      throw error;
    }
  }
  //
  async updateProductSkuById(
    productId: string,
    skuId: string,
    data: ProductSkuDto,
  ) {
    try {
      const product = await this.productDB.findOne({ _id: productId });
      if (!product) {
        throw new Error('Product not found');
      }
      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new Error('Sku not found');
      }
      //
      const dataForUpdate = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          dataForUpdate[`skuDetails.$.${key}`] = data[key];
        }
      }
      //
      await this.productDB.findOneAndUpdate(
        { _id: productId, 'skuDetails._id': skuId },
        { $set: { 'skuDetails.$': data } },
      );
      return {
        message: 'Product sku updated successfully',
        success: true,
        result: null,
      };
    } catch (error) {
      throw error;
    }
  }
  //
  async addProductSkuLicense(
    productId: string,
    skuId: string,
    licenseKey: string,
  ) {
    try {
      const product = await this.productDB.findOne({ _id: productId });
      if (!product) {
        throw new Error('Product does not exist');
      }
      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new Error('Sku does not exist');
      }
      const result = await this.productDB.createLicense(
        productId,
        skuId,
        licenseKey,
      );
      return {
        message: 'License key added successfully',
        success: true,
        result: result,
      };
    } catch (error) {
      throw error;
    }
  }
  //
  async removeProductSkuLicense(id: string) {
    try {
      const result = await this.productDB.removeLicense({ _id: id });
      return {
        message: 'License key removed successfully',
        success: true,
        result: result,
      };
    } catch (error) {
      throw error;
    }
  }
  //
  async getProductSkuLicenese(productId: string, skuId: string) {
    try {
      const product = await this.productDB.findOne({ _id: productId });
      if (!product) {
        throw new Error('Product does not exist');
      }
      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new Error('Sku does not exist');
      }
      const result = await this.productDB.findLicenses({ productId, skuId });
      return {
        message: 'License key added successfully',
        success: true,
        result: result,
      };
    } catch (error) {
      throw error;
    }
  }
  //
  async updateProductSkuLicense(
    productId: string,
    skuId: string,
    licenseKeyId: string,
    licenseKey: string,
  ) {
    try {
      const product = await this.productDB.findOne({ _id: productId });
      if (!product) {
        throw new Error('Sku does not exist');
      }
      const sku = await this.productDB.findOne((sku) => sku._id == skuId);
      if (!sku) {
        throw new Error('Sku does not exist');
      }
      const result = await this.productDB.updateLicense(
        { _id: licenseKeyId },
        {
          licenseKey: licenseKey,
        },
      );
      return {
        message: 'License updated successfully',
        success: true,
        result: result,
      };
    } catch (error) {
      throw error;
    }
  }
}
