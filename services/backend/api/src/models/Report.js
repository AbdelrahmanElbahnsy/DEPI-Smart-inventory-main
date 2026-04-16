import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('inventory', 'sales', 'purchases', 'alerts'),
    allowNull: false,
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    field: 'generated_by',
  },
  data: {
    type: DataTypes.JSON,
  },
  format: {
    type: DataTypes.ENUM('pdf', 'excel'),
  },
  filePath: {
    type: DataTypes.STRING(500),
    field: 'file_path',
  },
}, {
  tableName: 'reports',
  updatedAt: false,
});

export default Report;
