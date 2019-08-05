"use strict";
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      hash: {
        type: DataTypes.STRING, // base58
        allowNull: false,
        primaryKey: true
      },
      originator: {
        type: DataTypes.STRING,
        allowNull: false
      },
      destination: {
        type: DataTypes.STRING,
        allowNull: false
      },
      kind: {
        type: DataTypes.STRING,
        allowNull: false
      },
      args: {
        type: DataTypes.JSON,
        allowNull: false
      },
      parentHash: {
        type: DataTypes.STRING, // base58
        allowNull: true
      },
      chunkHash: {
        type: DataTypes.STRING, // base58
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      },
      logs: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: "transactions",
      underscored: true,
      timestamps: false
    }
  );
  Transaction.associate = function(models) {
    // associations can be defined here
  };
  return Transaction;
};
