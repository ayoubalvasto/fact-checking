"""
Dataset Generation Script
Generate and seed the medical fact-checking dataset

Usage:
    python generate_dataset.py --size 1000 --output data/claims.parquet
"""

import sys
import os
import logging
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ml_nlp"))

from ml_nlp.services.dataset_generator import DatasetGenerator
import argparse

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Generate medical claims dataset")
    parser.add_argument("--size", type=int, default=1000, help="Number of records to generate")
    parser.add_argument("--format", choices=["parquet", "json", "csv"], default="parquet", help="Output format")
    parser.add_argument("--output", type=str, default="data/claims", help="Output file path (without extension)")
    parser.add_argument("--seed-db", action="store_true", help="Also seed the database")
    
    args = parser.parse_args()
    
    try:
        logger.info(f"🔧 Generating {args.size} medical claims...")
        
        generator = DatasetGenerator()
        dataset = generator.generate_sample_dataset(args.size)
        
        logger.info(f"✅ Generated {len(dataset)} records")
        
        output_dir = os.path.dirname(args.output) or '.'
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Save in requested format
        if args.format == "parquet":
            output_file = f"{args.output}.parquet"
            generator.save_as_parquet(output_file)
            logger.info(f"💾 Saved to {output_file}")
        elif args.format == "json":
            output_file = f"{args.output}.jsonl"
            generator.save_as_json(output_file)
            logger.info(f"💾 Saved to {output_file}")
        elif args.format == "csv":
            output_file = f"{args.output}.csv"
            generator.save_as_csv(output_file)
            logger.info(f"💾 Saved to {output_file}")
        
        # Show statistics
        stats = generator.get_statistics()
        logger.info("\n📊 Dataset Statistics:")
        logger.info(f"  Total records: {stats.get('total_records', len(dataset))}")
        logger.info(f"  Avg confidence: {stats.get('avg_confidence', 0.0):.2f}")
        
        # Optionally seed database
        if args.seed_db:
            logger.info("\n💾 Seeding database...")
            try:
                from backend.app.database import SessionLocal
                db = SessionLocal()
                generator.export_to_database(db)
                logger.info("✅ Database seeded successfully")
            except ImportError:
                logger.warning("⚠️  Backend not available for database seeding")
            except Exception as e:
                logger.error(f"❌ Database seeding failed: {e}", exc_info=True)
        
        logger.info("✅ Dataset generation completed successfully")
        
    except ValueError as e:
        logger.error(f"❌ Invalid input: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Dataset generation failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
