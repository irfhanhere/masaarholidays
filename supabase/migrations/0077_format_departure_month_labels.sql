-- Migration 0077: Format Departure Month Labels to 4-Digit Years
-- Standardizes month labels from 'Month YY' (e.g. 'October 26') to 'Month YYYY' (e.g. 'October 2026')
-- to prevent search engines and pilgrims from mistaking the year for a day of the month.

UPDATE umrah_departure_months
SET
  display_label = CASE
    WHEN slug = 'october' THEN 'October 2026'
    WHEN slug = 'november' THEN 'November 2026'
    WHEN slug = 'december' THEN 'December 2026'
    WHEN slug = 'january' THEN 'January 2027'
    WHEN slug = 'february' THEN 'February 2027'
    WHEN slug = 'march' THEN 'March 2027'
    WHEN slug = 'april' THEN 'April 2027'
    WHEN slug = 'may' THEN 'May 2027'
    WHEN slug = 'june' THEN 'June 2027'
    WHEN slug = 'july' THEN 'July 2027'
    WHEN slug = 'august' THEN 'August 2027'
    WHEN slug = 'september' THEN 'September 2027'
    ELSE display_label
  END,
  meta_title = CASE
    WHEN slug = 'october' THEN 'Umrah Packages for October 2026 | Masaar Holidays'
    WHEN slug = 'november' THEN 'Umrah Packages for November 2026 | Masaar Holidays'
    WHEN slug = 'december' THEN 'Umrah Packages for December 2026 | Masaar Holidays'
    WHEN slug = 'january' THEN 'Umrah Packages for January 2027 | Masaar Holidays'
    WHEN slug = 'february' THEN 'Umrah Packages for February 2027 | Masaar Holidays'
    WHEN slug = 'march' THEN 'Umrah Packages for March 2027 | Masaar Holidays'
    WHEN slug = 'april' THEN 'Umrah Packages for April 2027 | Masaar Holidays'
    WHEN slug = 'may' THEN 'Umrah Packages for May 2027 | Masaar Holidays'
    WHEN slug = 'june' THEN 'Umrah Packages for June 2027 | Masaar Holidays'
    WHEN slug = 'july' THEN 'Umrah Packages for July 2027 | Masaar Holidays'
    ELSE meta_title
  END,
  meta_description = CASE
    WHEN slug = 'october' THEN 'Plan your October 2026 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'november' THEN 'Plan your November 2026 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'december' THEN 'Plan your December 2026 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'january' THEN 'Plan your January 2027 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'february' THEN 'Plan your February 2027 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'march' THEN 'Plan your March 2027 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'april' THEN 'Plan your April 2027 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'may' THEN 'Plan your May 2027 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    WHEN slug = 'june' THEN 'Plan your June 2027 Umrah departure from UAE — Essential, Signature and Exclusive packages with flights, Haram hotels and dedicated guidance.'
    ELSE meta_description
  END,
  updated_at = NOW();
