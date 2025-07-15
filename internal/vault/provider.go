package vault

type VaultProvider interface {
	GetSecret(key string) (string, error)
}
