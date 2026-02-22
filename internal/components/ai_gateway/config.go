package ai_gateway

import "github.com/warpstreamlabs/bento/public/service"

const (
	agfProvider             = "provider"
	agfModel                = "model"
	agfAPIKey               = "api_key"
	agfBaseURL              = "base_url"
	agfSystemPrompt         = "system_prompt"
	agfPrompt               = "prompt"
	agfArgsMapping          = "args_mapping"
	agfUnsafeDynamicPrompt  = "unsafe_dynamic_prompt"
	agfMaxTokens            = "max_tokens"
	agfTemperature          = "temperature"
	agfResultMap            = "result_map"
)

func Config() *service.ConfigSpec {
	return service.NewConfigSpec().
		Beta().
		Categories("AI").
		Summary("Calls an AI chat completion API and maps the response into the message.").
		Description(`
This processor sends a chat completion request to an AI provider and maps the response back into the message using a Bloblang mapping.

Supported providers:
- openai: OpenAI API (GPT models)
- anthropic: Anthropic API (Claude models)

The prompt field is a string template where ` + "`%v`" + ` placeholders are substituted with values from the args_mapping field. The args_mapping is a Bloblang mapping that must evaluate to an array of values matching the number of placeholders.

Alternatively, setting unsafe_dynamic_prompt to true enables interpolation functions in the prompt, allowing ` + "`${!this.field_name}`" + ` syntax to reference message fields directly. Both mechanisms can be used together.

The result_map is a Bloblang mapping where ` + "`this`" + ` refers to the AI response object containing the fields: content, model, finish_reason, and usage (with input_tokens and output_tokens). The ` + "`root`" + ` refers to the original message being modified.`).
		Field(service.NewStringEnumField(agfProvider, "openai", "anthropic").
			Description("The AI provider to use for chat completions.")).
		Field(service.NewStringField(agfModel).
			Description("The model identifier to use (e.g., 'gpt-4o', 'claude-sonnet-4-6').")).
		Field(service.NewStringField(agfAPIKey).
			Description("API key for authenticating with the AI provider.").
			Secret()).
		Field(service.NewStringField(agfBaseURL).
			Description("Custom base URL for the API endpoint. When empty, uses the provider's default URL.").
			Default("").
			Optional()).
		Field(service.NewStringField(agfSystemPrompt).
			Description("An optional system prompt to set the behavior of the AI model.").
			Default("").
			Optional()).
		Field(service.NewStringField(agfPrompt).
			Description("The user prompt template. Use `%v` placeholders for values provided by args_mapping.")).
		Field(service.NewBloblangField(agfArgsMapping).
			Description("An optional Bloblang mapping which should evaluate to an array of values matching in size to the number of `%v` placeholder arguments in the prompt.").
			Optional()).
		Field(service.NewBoolField(agfUnsafeDynamicPrompt).
			Description("When enabled, the prompt and system_prompt fields support interpolation functions, allowing `${!this.field_name}` syntax to reference message fields directly. Both interpolation and args_mapping can be used together.").
			Default(false).
			Advanced()).
		Field(service.NewIntField(agfMaxTokens).
			Description("Maximum number of tokens to generate in the response.").
			Default(1024)).
		Field(service.NewFloatField(agfTemperature).
			Description("Sampling temperature for the model. Higher values produce more random output.").
			Default(1.0)).
		Field(service.NewBloblangField(agfResultMap).
			Description("A Bloblang mapping that is executed on the AI response and applied to the original message. In this mapping, `this` refers to the AI response object and `root` refers to the original message.")).
		Version("1.0.0")
}
