import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from 'src/products/dto/create-product.dto';
import { Products } from '../schema/products';
import { Model } from 'mongoose';
import { ParsedOptions } from 'qs-to-mongo/dist/query/options-to-mongo';
import { License } from '../schema/license';
@Injectable()
export class ProductRespository {
  constructor(
    @InjectModel(Products.name) private readonly productModel: Model<Products>,
    @InjectModel(License.name) private readonly licenseModel: Model<License>,
  ) {}
  async create(product: CreateProductDto) {
    const createdProduct = await this.productModel.create(product);
    return createdProduct;
  }
  async findOne(query: any) {
    const result = await this.productModel.findOne(query);
    return result;
  }
  async findOneAndUpdate(query: any, update: any) {
    const product = await this.productModel.findOneAndUpdate(query, update, {
      new: true,
    });
    return product;
  }
  async findOneAndDelete(query: any) {
    const product = await this.productModel.findOneAndDelete(query);
    return product;
  }
  async findProductWithGroupBy() {
    const products = await this.productModel.aggregate([
      {
        $facet: {
          latestProducts: [{ $sort: { createAt: -1 } }, { $limit: 4 }],
          topRatedProducts: [{ $sort: { avgRating: -1 } }, { $limit: 8 }],
        },
      },
    ]);
    return products;
  }
  async find(query: Record<string, any>, options: ParsedOptions) {
    options.sort = options.sort || { _id: 1 };
    options.limit = options.limit || 12;
    options.skip = options.skip || 0;
    if (query.search) {
      query.productName = new RegExp(query.search, 'i');
      delete query.search;
    }
    const products = await this.productModel.aggregate([
      {
        $match: query,
      },
      {
        $sort: options.sort,
      },
      {
        $skip: options.skip,
      },
      {
        $limit: options.limit,
      },
    ]);

    const totalProductCount = await this.productModel.countDocuments(query);
    return { totalProductCount, products };
  }
  async updateProductImage() {}
  //
  async findRelatedProducts(query: Record<string, any>) {
    const products = await this.productModel.aggregate([
      {
        $match: query,
      },
      {
        $sample: { size: 4 },
      },
    ]);
    return products;
  }
  //
  async createLicense(product: string, productSku: string, licenseKey: string) {
    const license = await this.licenseModel.create({
      product,
      productSku,
      licenseKey,
    });
    return license;
  }
  //
  async removeLicense(query: any) {
    const license = await this.licenseModel.findOneAndDelete(query);
    return license;
  }
  //
  async findLicenses(query: any) {
    const license = await this.licenseModel.find(query);
    return license;
  }
  //
  async updateLicense(query: any, update: any) {
    const license = await this.licenseModel.findOneAndUpdate(query, update, {
      new: true,
    });
    return license;
  }
}
