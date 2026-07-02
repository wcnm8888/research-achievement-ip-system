-- Add nullable employee-number persistence for user imports.
ALTER TABLE "users" ADD COLUMN "employee_no" VARCHAR(64);
ALTER TABLE "users" ADD COLUMN "employee_no_normalized" VARCHAR(64);

CREATE UNIQUE INDEX "users_employee_no_normalized_key" ON "users"("employee_no_normalized");
