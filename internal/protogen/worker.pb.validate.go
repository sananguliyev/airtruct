// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: worker.proto

package protogen

import (
	"bytes"
	"errors"
	"fmt"
	"net"
	"net/mail"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"google.golang.org/protobuf/types/known/anypb"
)

// ensure the imports are used
var (
	_ = bytes.MinRead
	_ = errors.New("")
	_ = fmt.Print
	_ = utf8.UTFMax
	_ = (*regexp.Regexp)(nil)
	_ = (*strings.Reader)(nil)
	_ = net.IPv4len
	_ = time.Duration(0)
	_ = (*url.URL)(nil)
	_ = (*mail.Address)(nil)
	_ = anypb.Any{}
	_ = sort.Sort
)

// Validate checks the field values on AssignStreamRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *AssignStreamRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on AssignStreamRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// AssignStreamRequestMultiError, or nil if none found.
func (m *AssignStreamRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *AssignStreamRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for WorkerStreamId

	// no validation rules for Config

	if len(errors) > 0 {
		return AssignStreamRequestMultiError(errors)
	}

	return nil
}

// AssignStreamRequestMultiError is an error wrapping multiple validation
// errors returned by AssignStreamRequest.ValidateAll() if the designated
// constraints aren't met.
type AssignStreamRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m AssignStreamRequestMultiError) Error() string {
	msgs := make([]string, 0, len(m))
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m AssignStreamRequestMultiError) AllErrors() []error { return m }

// AssignStreamRequestValidationError is the validation error returned by
// AssignStreamRequest.Validate if the designated constraints aren't met.
type AssignStreamRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e AssignStreamRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e AssignStreamRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e AssignStreamRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e AssignStreamRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e AssignStreamRequestValidationError) ErrorName() string {
	return "AssignStreamRequestValidationError"
}

// Error satisfies the builtin error interface
func (e AssignStreamRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sAssignStreamRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = AssignStreamRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = AssignStreamRequestValidationError{}

// Validate checks the field values on FetchStreamRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *FetchStreamRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on FetchStreamRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// FetchStreamRequestMultiError, or nil if none found.
func (m *FetchStreamRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *FetchStreamRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for WorkerStreamId

	if len(errors) > 0 {
		return FetchStreamRequestMultiError(errors)
	}

	return nil
}

// FetchStreamRequestMultiError is an error wrapping multiple validation errors
// returned by FetchStreamRequest.ValidateAll() if the designated constraints
// aren't met.
type FetchStreamRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m FetchStreamRequestMultiError) Error() string {
	msgs := make([]string, 0, len(m))
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m FetchStreamRequestMultiError) AllErrors() []error { return m }

// FetchStreamRequestValidationError is the validation error returned by
// FetchStreamRequest.Validate if the designated constraints aren't met.
type FetchStreamRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e FetchStreamRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e FetchStreamRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e FetchStreamRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e FetchStreamRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e FetchStreamRequestValidationError) ErrorName() string {
	return "FetchStreamRequestValidationError"
}

// Error satisfies the builtin error interface
func (e FetchStreamRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sFetchStreamRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = FetchStreamRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = FetchStreamRequestValidationError{}

// Validate checks the field values on FetchStreamResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *FetchStreamResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on FetchStreamResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// FetchStreamResponseMultiError, or nil if none found.
func (m *FetchStreamResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *FetchStreamResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Status

	if len(errors) > 0 {
		return FetchStreamResponseMultiError(errors)
	}

	return nil
}

// FetchStreamResponseMultiError is an error wrapping multiple validation
// errors returned by FetchStreamResponse.ValidateAll() if the designated
// constraints aren't met.
type FetchStreamResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m FetchStreamResponseMultiError) Error() string {
	msgs := make([]string, 0, len(m))
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m FetchStreamResponseMultiError) AllErrors() []error { return m }

// FetchStreamResponseValidationError is the validation error returned by
// FetchStreamResponse.Validate if the designated constraints aren't met.
type FetchStreamResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e FetchStreamResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e FetchStreamResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e FetchStreamResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e FetchStreamResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e FetchStreamResponseValidationError) ErrorName() string {
	return "FetchStreamResponseValidationError"
}

// Error satisfies the builtin error interface
func (e FetchStreamResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sFetchStreamResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = FetchStreamResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = FetchStreamResponseValidationError{}

// Validate checks the field values on CompleteStreamRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *CompleteStreamRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on CompleteStreamRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// CompleteStreamRequestMultiError, or nil if none found.
func (m *CompleteStreamRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *CompleteStreamRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for WorkerStreamId

	if len(errors) > 0 {
		return CompleteStreamRequestMultiError(errors)
	}

	return nil
}

// CompleteStreamRequestMultiError is an error wrapping multiple validation
// errors returned by CompleteStreamRequest.ValidateAll() if the designated
// constraints aren't met.
type CompleteStreamRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m CompleteStreamRequestMultiError) Error() string {
	msgs := make([]string, 0, len(m))
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m CompleteStreamRequestMultiError) AllErrors() []error { return m }

// CompleteStreamRequestValidationError is the validation error returned by
// CompleteStreamRequest.Validate if the designated constraints aren't met.
type CompleteStreamRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e CompleteStreamRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e CompleteStreamRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e CompleteStreamRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e CompleteStreamRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e CompleteStreamRequestValidationError) ErrorName() string {
	return "CompleteStreamRequestValidationError"
}

// Error satisfies the builtin error interface
func (e CompleteStreamRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sCompleteStreamRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = CompleteStreamRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = CompleteStreamRequestValidationError{}

// Validate checks the field values on IngestRequest with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *IngestRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on IngestRequest with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in IngestRequestMultiError, or
// nil if none found.
func (m *IngestRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *IngestRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for WorkerStreamId

	// no validation rules for Method

	// no validation rules for Path

	// no validation rules for ContentType

	// no validation rules for Payload

	if len(errors) > 0 {
		return IngestRequestMultiError(errors)
	}

	return nil
}

// IngestRequestMultiError is an error wrapping multiple validation errors
// returned by IngestRequest.ValidateAll() if the designated constraints
// aren't met.
type IngestRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m IngestRequestMultiError) Error() string {
	msgs := make([]string, 0, len(m))
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m IngestRequestMultiError) AllErrors() []error { return m }

// IngestRequestValidationError is the validation error returned by
// IngestRequest.Validate if the designated constraints aren't met.
type IngestRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e IngestRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e IngestRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e IngestRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e IngestRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e IngestRequestValidationError) ErrorName() string { return "IngestRequestValidationError" }

// Error satisfies the builtin error interface
func (e IngestRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sIngestRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = IngestRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = IngestRequestValidationError{}

// Validate checks the field values on IngestResponse with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *IngestResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on IngestResponse with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in IngestResponseMultiError,
// or nil if none found.
func (m *IngestResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *IngestResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for StatusCode

	// no validation rules for Response

	if len(errors) > 0 {
		return IngestResponseMultiError(errors)
	}

	return nil
}

// IngestResponseMultiError is an error wrapping multiple validation errors
// returned by IngestResponse.ValidateAll() if the designated constraints
// aren't met.
type IngestResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m IngestResponseMultiError) Error() string {
	msgs := make([]string, 0, len(m))
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m IngestResponseMultiError) AllErrors() []error { return m }

// IngestResponseValidationError is the validation error returned by
// IngestResponse.Validate if the designated constraints aren't met.
type IngestResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e IngestResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e IngestResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e IngestResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e IngestResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e IngestResponseValidationError) ErrorName() string { return "IngestResponseValidationError" }

// Error satisfies the builtin error interface
func (e IngestResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sIngestResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = IngestResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = IngestResponseValidationError{}
