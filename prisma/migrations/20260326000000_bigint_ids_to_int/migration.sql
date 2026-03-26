-- Guard against overflow before narrowing bigint -> integer
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Carrot" WHERE "id" > 2147483647) THEN
    RAISE EXCEPTION 'Cannot migrate Carrot.id to INTEGER: value exceeds int range';
  END IF;

  IF EXISTS (SELECT 1 FROM "ChestPad" WHERE "id" > 2147483647) THEN
    RAISE EXCEPTION 'Cannot migrate ChestPad.id to INTEGER: value exceeds int range';
  END IF;

  IF EXISTS (SELECT 1 FROM "Connection" WHERE "id" > 2147483647) THEN
    RAISE EXCEPTION 'Cannot migrate Connection.id to INTEGER: value exceeds int range';
  END IF;
END
$$;

ALTER TABLE "Carrot"
  ALTER COLUMN "id" TYPE INTEGER USING "id"::integer;

ALTER TABLE "ChestPad"
  ALTER COLUMN "id" TYPE INTEGER USING "id"::integer;

ALTER TABLE "Connection"
  ALTER COLUMN "id" TYPE INTEGER USING "id"::integer;
