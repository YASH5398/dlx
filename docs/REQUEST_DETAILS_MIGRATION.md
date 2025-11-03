# Service Request Details Migration

## Overview
Updated the system to store `requestDetails` as a proper JSON object instead of a stringified JSON string in the `serviceRequests` Firestore collection. This allows the admin panel to display each subfield (fullName, emailId, phoneNumber, additionalNotes, etc.) separately instead of showing them as a single text block.

## Changes Made

### 1. **Interface Updates**

#### `src/utils/serviceRequestsAPI.ts`
- Updated `ServiceRequest` interface:
  ```typescript
  requestDetails: object | string; // Support both object (new) and string (legacy)
  ```

#### `src/utils/serviceRequestsFirestore.ts`
- Updated `ServiceRequestDoc` interface:
  ```typescript
  requestDetails: object | string; // Support both object (new) and string (legacy)
  ```

### 2. **Code Updates**

#### `src/utils/serviceRequestsAPI.ts` - `createServiceRequest()`
- **Before**: `requestDetails: typeof requestDetails === 'string' ? requestDetails : JSON.stringify(requestDetails)`
- **After**: Stores as object directly (with backward compatibility for string input)

#### `src/components/ServiceRequestModal.tsx`
- **Before**: `requestDetails: JSON.stringify({ steps: uiSteps, answers })`
- **After**: `requestDetails: { steps: uiSteps, answers }`

### 3. **Admin Panel**
- The `parseFormDetails()` function in `src/pages/SecretAdmin/AdminServiceRequestsEnhanced.tsx` already handles both string and object formats, so no changes were needed.

### 4. **Migration Script**

Created `scripts/migrateRequestDetails.js` to convert existing stringified `requestDetails` values to proper JSON objects.

**Usage:**
```bash
npm run migrate:requestDetails
```

**What it does:**
- Fetches all service requests from Firestore
- Checks if `requestDetails` is a string
- Parses the string as JSON
- Updates the document with the parsed object
- Processes in batches of 50 to avoid rate limits
- Provides detailed logging and summary

## Migration Process

1. **Run the migration script:**
   ```bash
   npm run migrate:requestDetails
   ```

2. **The script will:**
   - Check all service requests
   - Convert stringified `requestDetails` to objects
   - Skip documents that are already objects
   - Log progress and errors
   - Provide a summary of conversions

3. **Expected output:**
   ```
   🚀 Starting migration of requestDetails from string to object...
   📊 Found X service requests to check.
   📦 Processing Y batch(es)...
   ✅ Document ABC123: Converted string to object.
   ...
   📊 MIGRATION SUMMARY
   ✅ Total documents checked:        100
   🔄 Total documents converted:     85
   ✅ Already objects (skipped):      10
   ⚠️  Invalid format (skipped):     5
   ❌ Errors encountered:            0
   ```

## Backward Compatibility

The system maintains backward compatibility:
- **New requests**: Stored as objects directly
- **Existing requests**: Migration script converts strings to objects
- **Admin panel**: Handles both formats gracefully
- **API**: Accepts both string and object, converts strings to objects when creating new requests

## Benefits

1. **Better Data Structure**: Firestore can properly index nested fields
2. **Easier Querying**: Can query specific subfields directly
3. **Better Admin UI**: Fields display separately in a structured format
4. **Type Safety**: TypeScript can better infer types
5. **Performance**: No need to parse JSON strings on every read

## Testing

After migration, verify:
1. ✅ New service requests store `requestDetails` as object
2. ✅ Existing requests have been converted from string to object
3. ✅ Admin panel displays form fields correctly (not as a single text block)
4. ✅ All subfields (fullName, emailId, phoneNumber, additionalNotes1-5) display separately

## Rollback Plan

If needed, the system can still handle stringified values because:
- The `parseFormDetails()` function in the admin panel handles strings
- The `createServiceRequest()` function can accept strings and convert them

However, for consistency, it's recommended to keep all `requestDetails` as objects.

## Notes

- The migration script processes documents in batches to avoid Firestore rate limits
- The script includes error handling and detailed logging
- Documents with invalid JSON strings will be skipped with warnings
- Documents already in object format will be skipped

