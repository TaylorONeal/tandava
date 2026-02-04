# Data Import and Migration

**Purpose:** This guide walks you through importing your studio data into Tandava from another platform or from CSV files. Whether you are migrating from MindBody, Walla, Arketa, Momoyoga, or any other system, this workflow covers everything from preparing your files to verifying the results.

**Navigate to:** Studio Management > Import Data (`/manage/import`)

---

## Overview: What Data Can Be Imported

Tandava supports importing the following data types:

| Import Type | What It Includes |
|---|---|
| **Clients / Students** | Names, email addresses, phone numbers, dates of birth, emergency contacts, pronouns, notes, and tags. |
| **Class History / Attendance** | Past class bookings and attendance records, including dates, class names, teacher names, and check-in status. |
| **Transaction History** | Purchase history, payments, and refunds -- including membership purchases, class pack purchases, and drop-in payments. |

Each import type is handled as a separate import job. You can run multiple imports in sequence (for example, import students first, then import their attendance history).

> **Note:** Import your students first before importing attendance or transaction history. Attendance and transaction records reference student profiles by email address, so the student records need to exist in the system before linking historical data to them.

---

## Preparing Your CSV Files

Before uploading, prepare your CSV files with the following guidelines:

### Column Naming

- Use clear, descriptive column headers in the first row (e.g., `First Name`, `Last Name`, `Email`).
- Avoid blank column headers. If a column has no header, the system will label it "Column A", "Column B", etc., which makes mapping harder.
- Column names do not need to match Tandava's field names exactly -- the system auto-detects common patterns and you can manually adjust mappings.

### Date Formats

The system recognizes the following date formats:

- `MM/DD/YYYY` (e.g., `03/15/1990`)
- `YYYY-MM-DD` (e.g., `1990-03-15`)
- `DD/MM/YYYY` (e.g., `15/03/1990`) -- detected when day values exceed 12
- `Month DD, YYYY` (e.g., `March 15, 1990`)

> **Tip:** For best results, use `YYYY-MM-DD` (ISO 8601) format. It is unambiguous and eliminates confusion between US and international date conventions.

### Required Fields

Each import type has certain fields that must be present:

**Clients / Students:**
- `Email` (required -- used as the unique identifier for deduplication)
- `First Name` (required)
- `Last Name` (required)

**Class History / Attendance:**
- `Email` (required -- matches to existing student profile)
- `Class Date` (required)
- `Class Name` (required)

**Transaction History:**
- `Email` (required -- matches to existing student profile)
- `Transaction Date` (required)
- `Amount` (required)

### File Specifications

- **Format:** CSV (comma-separated values). Files must end with `.csv`.
- **Maximum file size:** 50 MB.
- **Encoding:** UTF-8 recommended. If you see garbled characters after import, re-export your CSV with UTF-8 encoding.

---

## The Import Wizard Walkthrough

The import process follows a guided, step-by-step wizard. Here is what each step involves:

### Step 1: Select Source Platform

Choose where your data is coming from:

- **MindBody Format** -- Recognizes the column layout from MindBody CSV exports.
- **Walla Format** -- Recognizes the column layout from Walla CSV exports.
- **Arketa Format** -- Recognizes the column layout from Arketa CSV exports.
- **Momoyoga Format** -- Recognizes the column layout from Momoyoga CSV exports.
- **Generic CSV** -- For any other system, or if you have built your own CSV. You will map columns manually.

Selecting a platform preset pre-loads column mappings, which means less manual work in the mapping step.

### Step 2: Select Import Type

Choose what kind of data you are importing:

- **Clients / Students** -- Names, emails, phone numbers, emergency contacts.
- **Class History / Attendance** -- Past class bookings and attendance records.
- **Transaction History** -- Purchase history, payments, and refunds.

Click **Continue** to proceed to file upload.

### Step 3: Upload CSV File

1. Click the upload area or drag and drop your CSV file.
2. The system validates the file format. If it is not a valid CSV, you will see an error.
3. Once uploaded, the system reads the column headers and sample data from the first few rows.

### Step 4: Review Auto-Detected Column Mappings

The mapping screen shows a table with four columns:

| CSV Column | | Maps To | Sample Values |
|---|---|---|---|
| Your column header from the CSV | Arrow | The Tandava field it will be imported into | First 2-3 values from your file |

The system auto-detects mappings based on column name similarity. For example:
- "First Name" in your CSV automatically maps to `first_name`.
- "Email" maps to `email`.
- "Mobile Phone" maps to `phone`.
- "Birth Date" maps to `date_of_birth`.

Auto-matched columns are pre-filled. Unmatched columns (where the system could not find a confident match) will show "Skip" by default.

A summary at the top tells you how many of your columns were auto-matched (e.g., "We auto-detected 8 of 10 columns").

> **Note:** Required fields are marked with a "Required" badge. The import will not proceed if a required field is unmapped.

### Step 5: Adjust Mappings as Needed

For any column that was not auto-matched, or where the auto-match is incorrect:

1. Click the dropdown in the "Maps To" column.
2. Choose the correct Tandava field from the list, or select **Skip this column** to exclude it from the import.
3. Review the sample values to confirm the mapping makes sense (e.g., make sure a column containing phone numbers is not mapped to the email field).

Available target fields for client imports include:
- First Name, Last Name, Email, Phone
- Date of Birth, Pronouns
- Emergency Contact Name, Emergency Contact Phone
- Notes, Tags

### Step 6: Preview First Rows

After mapping, click **Preview Import** to see a summary:

- **Total Records** -- How many rows are in your CSV.
- **Mapped Fields** -- How many columns you have mapped to Tandava fields.
- **First 3 rows** -- A table showing how the first few rows of data will look after mapping.
- **Duplicate handling** -- The system notes that duplicates (matched by email) will be skipped.

Review this carefully. This is your last chance to catch mapping errors before the import runs.

### Step 7: Run Import

Click **Start Import**. The system processes your file row by row:

- A progress bar shows the percentage complete.
- For large files, this may take a few minutes. Do not close the browser tab.

### Step 8: Review Results

When the import completes, you see a results summary:

| Metric | Description |
|---|---|
| **Total** | Number of rows in the CSV. |
| **Imported** | Rows that were successfully imported as new records. |
| **Errors** | Rows that could not be imported due to validation failures. |
| **Skipped** | Rows that were skipped (e.g., duplicate email already exists in the system). |

If there are errors, each one is listed with:
- The **row number** in the original CSV.
- The specific **error message** (e.g., "Invalid email format: 'not-an-email'", "Missing required field: Last Name").

You can **download an error report** as a CSV file, fix the issues in your source file, and re-import just the failed rows.

---

## Handling Common Issues

### Duplicate Records

The system uses **email address** as the unique identifier for students. If a row in your CSV has an email that already exists in Tandava, that row is skipped (not overwritten). This prevents accidental data loss during re-imports.

> **Tip:** If you need to update existing records (not just add new ones), use the student management interface to edit individual profiles, or contact support for bulk update options.

### Missing Required Fields

If a row is missing a required field (e.g., no email address, or a blank last name), that row will be logged as an error and skipped. The rest of the import continues normally.

To fix: open the error report, fill in the missing values in your CSV, and re-import the corrected rows.

### Date Format Mismatches

If the system misinterprets a date (e.g., reading `01/02/2024` as January 2 when you meant February 1), check the preview step carefully. You can:

1. Reformat your CSV to use `YYYY-MM-DD` before uploading.
2. Or ensure all dates in the column consistently use the same format so the auto-detection works correctly.

### Special Characters and Encoding

If you see garbled characters (e.g., accented names showing as `MartÃ­nez` instead of `Martinez`), your file is likely not saved as UTF-8. Re-export the CSV from your spreadsheet application and explicitly select UTF-8 encoding.

---

## Format Presets

When you select a source platform (MindBody, Walla, Arketa, or Momoyoga), the system loads a **format preset** -- a predefined set of column mappings based on the standard CSV export format from that platform.

For example, the MindBody preset knows that:
- MindBody exports a column called "First Name" which maps to `first_name`.
- MindBody exports "Mobile Phone" which maps to `phone`.
- MindBody exports "Client ID" which has no direct Tandava equivalent and is skipped by default.

Presets save significant time because you do not need to manually map every column. If the platform changes their export format, Tandava's presets are updated accordingly.

> **Note:** Even with a preset, always review the auto-detected mappings. Some platforms allow custom fields in their exports, and those will not be part of the preset.

---

## Saving Custom Column Mappings for Future Imports

If you plan to import data in multiple batches (e.g., importing students from one location today and another location next week), and your CSV files use the same column layout:

1. After configuring your column mappings in the mapping step, the system remembers the mapping for that import type and source combination.
2. On subsequent imports with the same source and type selection, the previous mappings are pre-loaded.
3. This eliminates re-mapping columns for every import when the file structure is consistent.

> **Tip:** If you work with a data analyst or consultant to prepare your migration files, agree on a standard column layout up front. This makes every import after the first one fast.

---

## Best Practices

### Do a Test Import First

Before importing your full dataset:

1. Create a test CSV with 5-10 representative rows. Include rows that test edge cases:
   - A row with all fields filled in.
   - A row with only the required fields.
   - A row with a date in your expected format.
   - A row with special characters in names (accents, hyphens, apostrophes).
   - A row with a potentially duplicate email.
2. Run the import wizard with this test file.
3. After import, navigate to **Studio Management > Students** and verify:
   - All fields imported correctly.
   - Names display properly (no encoding issues).
   - Dates parsed correctly.
   - Duplicate handling worked as expected.
4. If everything looks correct, proceed with the full import.

### Import Order

Follow this order for a complete migration:

1. **Students / Clients** -- Import these first, since attendance and transactions reference student profiles.
2. **Class History / Attendance** -- Import after students are in the system so records can be linked.
3. **Transaction History** -- Import last, after students and attendance are in place.

### Clean Your Data Before Import

- Remove test accounts and internal staff entries that you do not want in Tandava.
- Standardize formatting (e.g., phone numbers all in the same format, consistent name capitalization).
- Remove entirely blank rows.
- Check for and merge duplicate entries in your source data before exporting.

---

## Rollback -- What to Do If an Import Goes Wrong

If you discover problems after an import completes:

### Minor Issues (A Few Bad Records)

1. Navigate to **Studio Management > Students**.
2. Search for the affected records.
3. Edit or delete them individually.

### Major Issues (Large-Scale Data Problems)

If a large portion of the imported data is incorrect:

1. **Do not run another import on top of bad data.** The deduplication logic will skip records that already exist, which could mask problems.
2. Contact your Tandava administrator or use the administrative tools to identify and remove the batch of imported records. Import jobs are tracked in the **Import History** section at the bottom of the Import Data page, including the date, source, type, record count, and status of each past import.
3. Fix the source CSV.
4. Re-run the import.

> **Tip:** This is another reason to always run a test import with a small file first. Catching a column mapping error on 5 rows is trivial to fix. Catching it on 5,000 rows is not.

---

## Import History

Every import job is logged and visible at the bottom of the Import Data page. The history shows:

- **Date** of the import.
- **Source** platform (e.g., "CSV Migration", "MindBody Format").
- **Type** of data imported (Clients, Attendance, Transactions).
- **Total records** processed.
- **Status** -- `completed` (all rows succeeded or were cleanly skipped) or `partial` (some rows had errors).

Use the import history to track your migration progress and to reference past imports if questions arise about when and how data was brought into the system.

---

## Related Workflows

- [Managing the Daily Schedule](./managing-the-daily-schedule.md) -- Set up and run your schedule after importing your class data
- [Referral Programs](./referral-programs.md) -- Start growing your student base after your migration is complete
