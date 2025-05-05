#!/bin/bash

# Dependencies: cwebp and AWS CLI
# brew install webp awscli parallel curl jq

# Set R2 credentials from .env.local
export AWS_ACCESS_KEY_ID="3e7a1e83bbf097422110496732f79c65"
export AWS_SECRET_ACCESS_KEY="3ea90af11d49df0835e860c7639c99d6e141586672f1c0ed2084b732ff1b2c50"
export AWS_ENDPOINT_URL="https://950035267d1186d83269e8b8eb50e572.r2.cloudflarestorage.com"
BUCKET_NAME="better-badges"
R2_ACCOUNT_ID="950035267d1186d83269e8b8eb50e572"

# Create output directory for WebP files
OUTPUT_DIR="./webp_output"
mkdir -p $OUTPUT_DIR

# Create a log file
LOG_FILE="./webp_conversion.log"
touch $LOG_FILE

# Create log function
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

# Function to convert images
convert_images() {
  log "Starting batch conversion of JPG files to WebP"
  
  # Create temporary directory for processing
  TEMP_DIR=$(mktemp -d)
  log "Working in: $TEMP_DIR"

  # Step 1: List all JPG files in the bucket
  log "Listing all JPG files from bucket..."
  aws s3 ls s3://$BUCKET_NAME --recursive --endpoint-url $AWS_ENDPOINT_URL | grep -i '\.jpe\?g$' > $TEMP_DIR/filelist.txt

  # Count files
  TOTAL_COUNT=$(wc -l < $TEMP_DIR/filelist.txt)
  log "Found $TOTAL_COUNT JPG files to convert"

  # Step 2: Process files in smaller batches to avoid overwhelming the system
  BATCH_SIZE=5
  CURRENT=0
  SUCCESS=0
  FAILURES=0

  mkdir -p $TEMP_DIR/downloads
  mkdir -p $TEMP_DIR/webp

  cat $TEMP_DIR/filelist.txt | awk '{print $4}' | while read FILE; do
    CURRENT=$((CURRENT + 1))
    log "[$CURRENT/$TOTAL_COUNT] Processing: $FILE"
    
    # Create needed subdirectories
    mkdir -p "$(dirname "$TEMP_DIR/downloads/$FILE")"
    mkdir -p "$(dirname "$TEMP_DIR/webp/$FILE")"
    mkdir -p "$(dirname "$OUTPUT_DIR/$FILE")"
    
    # Download with retry
    RETRIES=0
    MAX_RETRIES=3
    while [ $RETRIES -lt $MAX_RETRIES ]; do
      if aws s3 cp "s3://$BUCKET_NAME/$FILE" "$TEMP_DIR/downloads/$FILE" --endpoint-url $AWS_ENDPOINT_URL; then
        log "  ✓ Downloaded"
        break
      else
        RETRIES=$((RETRIES + 1))
        if [ $RETRIES -lt $MAX_RETRIES ]; then
          log "  ⚠️ Download failed, retrying ($RETRIES/$MAX_RETRIES)..."
          sleep 2
        else
          log "  ❌ Download failed after $MAX_RETRIES attempts"
          FAILURES=$((FAILURES + 1))
          continue 2  # Skip to next file
        fi
      fi
    done
    
    # Convert to WebP
    WEBP_FILE="${FILE%.*}.webp"
    if cwebp -quiet -q 85 "$TEMP_DIR/downloads/$FILE" -o "$TEMP_DIR/webp/$WEBP_FILE"; then
      log "  ✓ Converted to WebP"
      
      # Copy to output directory
      cp "$TEMP_DIR/webp/$WEBP_FILE" "$OUTPUT_DIR/$WEBP_FILE"
      
      # Track successful conversion
      echo "$WEBP_FILE" >> $TEMP_DIR/successful_conversions.txt
      # Also store original JPG filename for cleanup
      echo "$FILE" >> $TEMP_DIR/original_jpg_files.txt
      SUCCESS=$((SUCCESS + 1))
    else
      log "  ❌ Conversion failed"
      FAILURES=$((FAILURES + 1))
    fi
    
    # Clean up downloaded file to save space
    rm -f "$TEMP_DIR/downloads/$FILE"
    rm -f "$TEMP_DIR/webp/$WEBP_FILE"
    
    # Throttle to avoid overwhelming R2
    if [ $((CURRENT % BATCH_SIZE)) -eq 0 ]; then
      log "----- Processed $CURRENT/$TOTAL_COUNT files (batch completed) -----"
      sleep 2
    fi
  done

  # Print summary
  log ""
  log "=== Conversion Complete ==="
  log "Total files: $TOTAL_COUNT"
  log "Successfully converted: $SUCCESS"
  log "Failed: $FAILURES"
  log ""
  log "WebP files saved locally to: $OUTPUT_DIR"
  log ""

  # Move successful conversions list to output dir
  if [ -f "$TEMP_DIR/successful_conversions.txt" ]; then
    cp "$TEMP_DIR/successful_conversions.txt" "$OUTPUT_DIR/successful_conversions.txt"
  fi
  
  # Move original JPG filenames list to output dir for cleanup
  if [ -f "$TEMP_DIR/original_jpg_files.txt" ]; then
    cp "$TEMP_DIR/original_jpg_files.txt" "$OUTPUT_DIR/original_jpg_files.txt"
  fi

  # Clean up temp directory
  rm -rf $TEMP_DIR
}

# Function to upload WebP images using direct HTTP PUT with presigned URL
upload_images() {
  log "Starting upload of WebP files to R2 bucket"
  
  if [ ! -f "$OUTPUT_DIR/successful_conversions.txt" ]; then
    log "No conversion list found. Please run conversion first."
    exit 1
  fi
  
  TOTAL_COUNT=$(wc -l < "$OUTPUT_DIR/successful_conversions.txt")
  log "Found $TOTAL_COUNT WebP files to upload"
  
  CURRENT=0
  SUCCESS=0
  FAILURES=0
  
  # Use wrangler to upload files (more reliable than AWS CLI for R2)
  if ! command -v wrangler &> /dev/null; then
    log "Wrangler CLI not found. Installing..."
    npm install -g wrangler
  fi
  
  cat "$OUTPUT_DIR/successful_conversions.txt" | while read WEBP_FILE; do
    CURRENT=$((CURRENT + 1))
    log "[$CURRENT/$TOTAL_COUNT] Uploading: $WEBP_FILE"
    
    # Check if file exists locally
    if [ ! -f "$OUTPUT_DIR/$WEBP_FILE" ]; then
      log "  ❌ File not found locally: $OUTPUT_DIR/$WEBP_FILE"
      FAILURES=$((FAILURES + 1))
      continue
    fi
    
    # Try upload with Wrangler (more reliable for R2)
    RETRIES=0
    MAX_RETRIES=3
    while [ $RETRIES -lt $MAX_RETRIES ]; do
      if wrangler r2 object put "$BUCKET_NAME/$WEBP_FILE" --file "$OUTPUT_DIR/$WEBP_FILE" --remote; then
        log "  ✓ Successfully uploaded with Wrangler"
        # Track successful uploads for cleanup
        echo "$WEBP_FILE" >> "$OUTPUT_DIR/successful_uploads.txt"
        SUCCESS=$((SUCCESS + 1))
        break
      else
        RETRIES=$((RETRIES + 1))
        if [ $RETRIES -lt $MAX_RETRIES ]; then
          log "  ⚠️ Upload failed with Wrangler, retrying ($RETRIES/$MAX_RETRIES)..."
          sleep 3
        else
          log "  ⚠️ All Wrangler upload attempts failed, trying AWS CLI..."
          
          # Try AWS CLI as fallback
          if aws s3 cp "$OUTPUT_DIR/$WEBP_FILE" "s3://$BUCKET_NAME/$WEBP_FILE" --endpoint-url $AWS_ENDPOINT_URL; then
            log "  ✓ Successfully uploaded with AWS CLI"
            # Track successful uploads for cleanup
            echo "$WEBP_FILE" >> "$OUTPUT_DIR/successful_uploads.txt"
            SUCCESS=$((SUCCESS + 1))
            break
          else
            log "  ❌ Upload failed with both methods"
            FAILURES=$((FAILURES + 1))
          fi
        fi
      fi
    done
    
    # Throttle to avoid overwhelming the API
    if [ $((CURRENT % 5)) -eq 0 ]; then
      log "----- Uploaded $CURRENT/$TOTAL_COUNT files -----"
      sleep 2
    fi
  done
  
  # Print summary
  log ""
  log "=== Upload Complete ==="
  log "Total files: $TOTAL_COUNT"
  log "Successfully uploaded: $SUCCESS"
  log "Failed: $FAILURES"
  log ""
}

# Function to clean up original JPG files after successful conversion and upload to WebP
cleanup_originals() {
  log "Starting cleanup of original JPG files from R2 bucket"
  
  if [ ! -f "$OUTPUT_DIR/successful_uploads.txt" ]; then
    log "No successful uploads list found. Please run upload first."
    exit 1
  fi
  
  if [ ! -f "$OUTPUT_DIR/original_jpg_files.txt" ]; then
    log "No original JPG files list found. Please run conversion first."
    exit 1
  fi
  
  # Create a mapping between WebP files and their JPG originals
  TEMP_MAP=$(mktemp)
  SUCCESSFUL_WEBPS=$(cat "$OUTPUT_DIR/successful_uploads.txt")
  
  # Get total count of JPG files to delete
  TOTAL_COUNT=$(wc -l < "$OUTPUT_DIR/successful_uploads.txt")
  log "Found $TOTAL_COUNT JPG files to remove (corresponding to successfully uploaded WebP files)"
  
  CURRENT=0
  REMOVED=0
  FAILURES=0
  
  # Process each successfully uploaded WebP file
  while read WEBP_FILE; do
    # Get the corresponding JPG filename
    JPG_FILE="${WEBP_FILE%.webp}.jpg"
    # Try with uppercase extension too (some files might use .JPG)
    JPG_FILE_UPPER="${WEBP_FILE%.webp}.JPG"
    
    CURRENT=$((CURRENT + 1))
    
    # Delete the original JPG file
    log "[$CURRENT/$TOTAL_COUNT] Removing original JPG: $JPG_FILE"
    
    # Try delete with Wrangler (more reliable for R2)
    if wrangler r2 object delete "$BUCKET_NAME/$JPG_FILE" --remote; then
      log "  ✓ Successfully removed original JPG with Wrangler"
      REMOVED=$((REMOVED + 1))
    else
      log "  ⚠️ Wrangler delete failed, trying uppercase extension: $JPG_FILE_UPPER"
      
      # Try with uppercase extension
      if wrangler r2 object delete "$BUCKET_NAME/$JPG_FILE_UPPER" --remote; then
        log "  ✓ Successfully removed original JPG (uppercase extension) with Wrangler"
        REMOVED=$((REMOVED + 1))
      else
        log "  ⚠️ Wrangler delete failed, trying AWS CLI..."
        
        # Try AWS CLI as fallback
        if aws s3 rm "s3://$BUCKET_NAME/$JPG_FILE" --endpoint-url $AWS_ENDPOINT_URL; then
          log "  ✓ Successfully removed original JPG with AWS CLI"
          REMOVED=$((REMOVED + 1))
        elif aws s3 rm "s3://$BUCKET_NAME/$JPG_FILE_UPPER" --endpoint-url $AWS_ENDPOINT_URL; then
          log "  ✓ Successfully removed original JPG (uppercase extension) with AWS CLI"
          REMOVED=$((REMOVED + 1))
        else
          log "  ❌ Failed to remove original JPG with both methods"
          FAILURES=$((FAILURES + 1))
        fi
      fi
    fi
    
    # Throttle to avoid overwhelming the API
    if [ $((CURRENT % 5)) -eq 0 ]; then
      log "----- Processed $CURRENT/$TOTAL_COUNT files -----"
      sleep 2
    fi
  done < "$OUTPUT_DIR/successful_uploads.txt"
  
  # Clean up temp file
  rm -f $TEMP_MAP
  
  # Print summary
  log ""
  log "=== Cleanup Complete ==="
  log "Total files: $TOTAL_COUNT"
  log "Successfully removed: $REMOVED"
  log "Failed to remove: $FAILURES"
  log ""
}

# Check command line arguments
if [ $# -eq 0 ]; then
  echo "Usage: $0 [convert|upload|cleanup|all]"
  echo "  convert - Only download and convert JPG files to WebP"
  echo "  upload  - Only upload previously converted WebP files"
  echo "  cleanup - Remove original JPG files after successful WebP conversion and upload"
  echo "  all     - Perform all steps: conversion, upload, and cleanup"
  exit 1
fi

case "$1" in
  convert)
    convert_images
    ;;
  upload)
    upload_images
    ;;
  cleanup)
    cleanup_originals
    ;;
  all)
    convert_images
    upload_images
    cleanup_originals
    ;;
  both)
    convert_images
    upload_images
    ;;
  *)
    echo "Invalid option: $1"
    echo "Usage: $0 [convert|upload|cleanup|all]"
    exit 1
    ;;
esac