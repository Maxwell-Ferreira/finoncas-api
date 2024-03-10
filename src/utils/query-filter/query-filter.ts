'use strict';

import { HttpException } from '@nestjs/common';
import { convert } from '../date.utils';

export class QueryFilter {
  prepare(
    { limit = 20, page = 1, search, filters, sorters },
    searchFields: string[] = [],
  ) {
    const preparedData: Record<any, any> = {};
    const preparedFilters: Record<any, any> = {};

    if (limit > 100 || limit < 1) {
      throw new HttpException('Limite de listagem inválido.', 401);
    }

    preparedData.limit = +limit;
    preparedData.page = +page;

    if (filters) {
      let value;
      let aux;
      filters = JSON.parse(filters);

      Object.keys(filters).forEach((key) => {
        value = filters[key];

        if (typeof value === 'object') {
          if (value.length) {
            preparedFilters[key] = { $in: value };
          } else {
            aux = {};
            if (value.min !== null && value.min !== undefined) {
              aux.$gte = isNaN(value.min)
                ? convert(value.min, 'min')
                : Number(value.min);
            }
            if (value.max !== null && value.max !== undefined) {
              aux.$lte = isNaN(value.max)
                ? convert(value.max, 'max')
                : Number(value.max);
            }

            preparedFilters[key] = aux;

            if (key === 'expected_on') {
              preparedFilters[key] = {
                $elemMatch: { date: aux, status: 'PENDING' },
              };
            }
          }
        } else {
          if (value === true || value === false) {
            preparedFilters[key] = value;
          } else {
            preparedFilters[key] = isNaN(value) ? value : Number(value);
          }
        }
      });
    }
    if (search && search.length >= 3) {
      const regex = { $regex: search, $options: 'i' };
      preparedFilters.$or = [];
      for (const field of searchFields) {
        preparedFilters.$or.push({ [field]: regex });
      }
      if (preparedFilters.$or.length <= 0) delete preparedFilters.$or;
    }

    const sortersObj = sorters ? JSON.parse(sorters) : null;

    const sorterDirectionsAggregate = { ASC: 1, DESC: -1 };
    const formattedSorters = {};

    const hasSorters = sortersObj && sortersObj.length;

    if (hasSorters) {
      sortersObj.forEach((sorter) => {
        formattedSorters[sorter.column] =
          sorterDirectionsAggregate[sorter.direction];
      });
    }

    preparedData.sorters = hasSorters ? formattedSorters : { created_at: -1 };

    preparedData.filters = preparedFilters;

    return preparedData;
  }

  async findAll({
    queryParams,
    model,
    filters = {},
    searchFields = [],
    additionalPipeline = null,
  }) {
    const preparedParams = this.prepare(queryParams, searchFields);
    const { sorters, page, limit } = preparedParams;

    const allFilters = { ...preparedParams.filters, ...filters };

    const pipeline = [
      { $match: allFilters },
      { $sort: sorters },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    if (additionalPipeline) {
      pipeline.push(...additionalPipeline);
    }

    const data = await model.aggregate(pipeline);
    const total = await model
      .countDocuments(allFilters)
      .then((total) => total || 0);

    return {
      total,
      perPage: limit,
      page: page,
      lastPage: Math.ceil(total / limit) || 1,
      data,
    };
  }

  async report({
    queryParams,
    model,
    filters = {},
    searchFields = [],
    additionalPipeline = null,
  }) {
    const preparedParams = this.prepare(queryParams, searchFields);

    const allFilters = { ...preparedParams.filters, ...filters };

    const pipeline = [
      { $match: allFilters },
      { $sort: preparedParams.sorters },
    ];

    if (additionalPipeline) {
      pipeline.push(...additionalPipeline);
    }

    return model.aggregate(pipeline);
  }
}
