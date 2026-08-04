CREATE TABLE IF NOT EXISTS treasury_yields (
  rate_date DATE NOT NULL,
  y_1_mo NUMERIC(6, 2) NULL,
  y_1_5_mo NUMERIC(6, 2) NULL,
  y_2_mo NUMERIC(6, 2) NULL,
  y_3_mo NUMERIC(6, 2) NULL,
  y_4_mo NUMERIC(6, 2) NULL,
  y_6_mo NUMERIC(6, 2) NULL,
  y_1_yr NUMERIC(6, 2) NULL,
  y_2_yr NUMERIC(6, 2) NULL,
  y_3_yr NUMERIC(6, 2) NULL,
  y_5_yr NUMERIC(6, 2) NULL,
  y_7_yr NUMERIC(6, 2) NULL,
  y_10_yr NUMERIC(6, 2) NULL,
  y_20_yr NUMERIC(6, 2) NULL,
  y_30_yr NUMERIC(6, 2) NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_treasury_yields PRIMARY KEY (rate_date)
);
