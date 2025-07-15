package vault

import (
	"github.com/rs/zerolog/log"

	"github.com/sananguliyev/airtruct/internal/config"
	"github.com/sananguliyev/airtruct/internal/persistence"
)

type LocalProvider struct {
	secretConfig *config.SecretConfig
	secretRepo   persistence.SecretRepository
	aesgcm       *AESGCM
}

func NewLocalProvider(secretConfig *config.SecretConfig, secretRepo persistence.SecretRepository) VaultProvider {
	if secretConfig.Provider != config.SecretProviderLocal {
		log.Fatal().Msg("Invalid secret provider")
		return nil
	}
	aesgcm, err := NewAESGCM([]byte(secretConfig.Key))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create AESGCM")
		return nil
	}

	return &LocalProvider{
		secretConfig: secretConfig,
		secretRepo:   secretRepo,
		aesgcm:       aesgcm,
	}
}

func (p *LocalProvider) GetSecret(key string) (string, error) {
	secret, err := p.secretRepo.GetByKey(key)
	if err != nil {
		return "", err
	}

	decryptedValue, err := p.aesgcm.Decrypt(secret.EncryptedValue)
	if err != nil {
		return "", err
	}

	return decryptedValue, nil
}
