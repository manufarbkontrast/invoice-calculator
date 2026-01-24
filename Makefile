.PHONY: deploy migrate logs restart down clean

# Deployment auf Production Server
deploy:
	@echo "🚀 Starting deployment..."
	@git pull origin $$(git branch --show-current)
	@docker compose down
	@docker compose build --no-cache
	@docker compose up -d
	@echo "✅ Deployment completed!"
	@echo ""
	@docker compose ps
	@echo ""
	@echo "📋 Recent logs:"
	@docker compose logs --tail=30

# Datenbank Migration ausführen
migrate:
	@echo "🔄 Running database migration..."
	@docker compose --profile migrate run --rm invoice-migrate
	@echo "✅ Migration completed!"

# Logs in Echtzeit anzeigen
logs:
	@docker compose logs -f

# Container neu starten (ohne Rebuild)
restart:
	@echo "🔄 Restarting containers..."
	@docker compose restart
	@echo "✅ Restart completed!"
	@docker compose ps

# Container stoppen
down:
	@docker compose down

# Aufräumen (alte Images, Container, etc.)
clean:
	@echo "🧹 Cleaning up..."
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Cleanup completed!"
