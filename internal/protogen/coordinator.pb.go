// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.36.6
// 	protoc        v5.29.3
// source: coordinator.proto

package protogen

import (
	_ "github.com/envoyproxy/protoc-gen-validate/validate"
	_ "google.golang.org/genproto/googleapis/api/annotations"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	emptypb "google.golang.org/protobuf/types/known/emptypb"
	structpb "google.golang.org/protobuf/types/known/structpb"
	timestamppb "google.golang.org/protobuf/types/known/timestamppb"
	reflect "reflect"
	sync "sync"
	unsafe "unsafe"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type RegisterWorkerRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Port          uint32                 `protobuf:"varint,2,opt,name=port,proto3" json:"port,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *RegisterWorkerRequest) Reset() {
	*x = RegisterWorkerRequest{}
	mi := &file_coordinator_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *RegisterWorkerRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*RegisterWorkerRequest) ProtoMessage() {}

func (x *RegisterWorkerRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use RegisterWorkerRequest.ProtoReflect.Descriptor instead.
func (*RegisterWorkerRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{0}
}

func (x *RegisterWorkerRequest) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *RegisterWorkerRequest) GetPort() uint32 {
	if x != nil {
		return x.Port
	}
	return 0
}

type DeregisterWorkerRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *DeregisterWorkerRequest) Reset() {
	*x = DeregisterWorkerRequest{}
	mi := &file_coordinator_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *DeregisterWorkerRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DeregisterWorkerRequest) ProtoMessage() {}

func (x *DeregisterWorkerRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DeregisterWorkerRequest.ProtoReflect.Descriptor instead.
func (*DeregisterWorkerRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{1}
}

func (x *DeregisterWorkerRequest) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

type WorkerStreamStatusRequest struct {
	state          protoimpl.MessageState `protogen:"open.v1"`
	WorkerStreamId int64                  `protobuf:"varint,1,opt,name=worker_stream_id,json=workerStreamId,proto3" json:"worker_stream_id,omitempty"`
	Status         WorkerStreamStatus     `protobuf:"varint,2,opt,name=status,proto3,enum=protorender.WorkerStreamStatus" json:"status,omitempty"`
	unknownFields  protoimpl.UnknownFields
	sizeCache      protoimpl.SizeCache
}

func (x *WorkerStreamStatusRequest) Reset() {
	*x = WorkerStreamStatusRequest{}
	mi := &file_coordinator_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *WorkerStreamStatusRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*WorkerStreamStatusRequest) ProtoMessage() {}

func (x *WorkerStreamStatusRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[2]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use WorkerStreamStatusRequest.ProtoReflect.Descriptor instead.
func (*WorkerStreamStatusRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{2}
}

func (x *WorkerStreamStatusRequest) GetWorkerStreamId() int64 {
	if x != nil {
		return x.WorkerStreamId
	}
	return 0
}

func (x *WorkerStreamStatusRequest) GetStatus() WorkerStreamStatus {
	if x != nil {
		return x.Status
	}
	return WorkerStreamStatus_waiting
}

type ListWorkersRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Status        string                 `protobuf:"bytes,1,opt,name=status,proto3" json:"status,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListWorkersRequest) Reset() {
	*x = ListWorkersRequest{}
	mi := &file_coordinator_proto_msgTypes[3]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListWorkersRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListWorkersRequest) ProtoMessage() {}

func (x *ListWorkersRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[3]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListWorkersRequest.ProtoReflect.Descriptor instead.
func (*ListWorkersRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{3}
}

func (x *ListWorkersRequest) GetStatus() string {
	if x != nil {
		return x.Status
	}
	return ""
}

type ListWorkersResponse struct {
	state         protoimpl.MessageState        `protogen:"open.v1"`
	Data          []*ListWorkersResponse_Worker `protobuf:"bytes,1,rep,name=data,proto3" json:"data,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListWorkersResponse) Reset() {
	*x = ListWorkersResponse{}
	mi := &file_coordinator_proto_msgTypes[4]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListWorkersResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListWorkersResponse) ProtoMessage() {}

func (x *ListWorkersResponse) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[4]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListWorkersResponse.ProtoReflect.Descriptor instead.
func (*ListWorkersResponse) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{4}
}

func (x *ListWorkersResponse) GetData() []*ListWorkersResponse_Worker {
	if x != nil {
		return x.Data
	}
	return nil
}

type ListStreamsRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Status        string                 `protobuf:"bytes,1,opt,name=status,proto3" json:"status,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListStreamsRequest) Reset() {
	*x = ListStreamsRequest{}
	mi := &file_coordinator_proto_msgTypes[5]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListStreamsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListStreamsRequest) ProtoMessage() {}

func (x *ListStreamsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[5]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListStreamsRequest.ProtoReflect.Descriptor instead.
func (*ListStreamsRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{5}
}

func (x *ListStreamsRequest) GetStatus() string {
	if x != nil {
		return x.Status
	}
	return ""
}

type ListStreamsResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Data          []*Stream              `protobuf:"bytes,1,rep,name=data,proto3" json:"data,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListStreamsResponse) Reset() {
	*x = ListStreamsResponse{}
	mi := &file_coordinator_proto_msgTypes[6]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListStreamsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListStreamsResponse) ProtoMessage() {}

func (x *ListStreamsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[6]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListStreamsResponse.ProtoReflect.Descriptor instead.
func (*ListStreamsResponse) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{6}
}

func (x *ListStreamsResponse) GetData() []*Stream {
	if x != nil {
		return x.Data
	}
	return nil
}

type GetStreamRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            int64                  `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *GetStreamRequest) Reset() {
	*x = GetStreamRequest{}
	mi := &file_coordinator_proto_msgTypes[7]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *GetStreamRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetStreamRequest) ProtoMessage() {}

func (x *GetStreamRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[7]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetStreamRequest.ProtoReflect.Descriptor instead.
func (*GetStreamRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{7}
}

func (x *GetStreamRequest) GetId() int64 {
	if x != nil {
		return x.Id
	}
	return 0
}

type StreamResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Data          *Stream                `protobuf:"bytes,1,opt,name=data,proto3" json:"data,omitempty"`
	Meta          *CommonResponse        `protobuf:"bytes,2,opt,name=meta,proto3" json:"meta,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *StreamResponse) Reset() {
	*x = StreamResponse{}
	mi := &file_coordinator_proto_msgTypes[8]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *StreamResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*StreamResponse) ProtoMessage() {}

func (x *StreamResponse) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[8]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use StreamResponse.ProtoReflect.Descriptor instead.
func (*StreamResponse) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{8}
}

func (x *StreamResponse) GetData() *Stream {
	if x != nil {
		return x.Data
	}
	return nil
}

func (x *StreamResponse) GetMeta() *CommonResponse {
	if x != nil {
		return x.Meta
	}
	return nil
}

type Event struct {
	state          protoimpl.MessageState `protogen:"open.v1"`
	WorkerStreamId int64                  `protobuf:"varint,1,opt,name=worker_stream_id,json=workerStreamId,proto3" json:"worker_stream_id,omitempty"`
	Section        string                 `protobuf:"bytes,2,opt,name=section,proto3" json:"section,omitempty"`
	ComponentLabel string                 `protobuf:"bytes,3,opt,name=component_label,json=componentLabel,proto3" json:"component_label,omitempty"`
	Type           string                 `protobuf:"bytes,4,opt,name=type,proto3" json:"type,omitempty"`
	Content        string                 `protobuf:"bytes,5,opt,name=content,proto3" json:"content,omitempty"`
	Meta           *structpb.Struct       `protobuf:"bytes,6,opt,name=meta,proto3" json:"meta,omitempty"`
	unknownFields  protoimpl.UnknownFields
	sizeCache      protoimpl.SizeCache
}

func (x *Event) Reset() {
	*x = Event{}
	mi := &file_coordinator_proto_msgTypes[9]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *Event) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Event) ProtoMessage() {}

func (x *Event) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[9]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Event.ProtoReflect.Descriptor instead.
func (*Event) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{9}
}

func (x *Event) GetWorkerStreamId() int64 {
	if x != nil {
		return x.WorkerStreamId
	}
	return 0
}

func (x *Event) GetSection() string {
	if x != nil {
		return x.Section
	}
	return ""
}

func (x *Event) GetComponentLabel() string {
	if x != nil {
		return x.ComponentLabel
	}
	return ""
}

func (x *Event) GetType() string {
	if x != nil {
		return x.Type
	}
	return ""
}

func (x *Event) GetContent() string {
	if x != nil {
		return x.Content
	}
	return ""
}

func (x *Event) GetMeta() *structpb.Struct {
	if x != nil {
		return x.Meta
	}
	return nil
}

type MetricsRequest struct {
	state                      protoimpl.MessageState `protogen:"open.v1"`
	WorkerStreamId             int64                  `protobuf:"varint,1,opt,name=worker_stream_id,json=workerStreamId,proto3" json:"worker_stream_id,omitempty"`
	InputEvents                uint64                 `protobuf:"varint,2,opt,name=input_events,json=inputEvents,proto3" json:"input_events,omitempty"`
	ProcessorErrors            uint64                 `protobuf:"varint,3,opt,name=processor_errors,json=processorErrors,proto3" json:"processor_errors,omitempty"`
	OutputEvents               uint64                 `protobuf:"varint,4,opt,name=output_events,json=outputEvents,proto3" json:"output_events,omitempty"`
	InputEventsByComponent     map[string]uint64      `protobuf:"bytes,5,rep,name=input_events_by_component,json=inputEventsByComponent,proto3" json:"input_events_by_component,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"varint,2,opt,name=value"`
	ProcessorEventsByComponent map[string]uint64      `protobuf:"bytes,6,rep,name=processor_events_by_component,json=processorEventsByComponent,proto3" json:"processor_events_by_component,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"varint,2,opt,name=value"`
	OutputEventsByComponent    map[string]uint64      `protobuf:"bytes,7,rep,name=output_events_by_component,json=outputEventsByComponent,proto3" json:"output_events_by_component,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"varint,2,opt,name=value"`
	unknownFields              protoimpl.UnknownFields
	sizeCache                  protoimpl.SizeCache
}

func (x *MetricsRequest) Reset() {
	*x = MetricsRequest{}
	mi := &file_coordinator_proto_msgTypes[10]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MetricsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MetricsRequest) ProtoMessage() {}

func (x *MetricsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[10]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use MetricsRequest.ProtoReflect.Descriptor instead.
func (*MetricsRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{10}
}

func (x *MetricsRequest) GetWorkerStreamId() int64 {
	if x != nil {
		return x.WorkerStreamId
	}
	return 0
}

func (x *MetricsRequest) GetInputEvents() uint64 {
	if x != nil {
		return x.InputEvents
	}
	return 0
}

func (x *MetricsRequest) GetProcessorErrors() uint64 {
	if x != nil {
		return x.ProcessorErrors
	}
	return 0
}

func (x *MetricsRequest) GetOutputEvents() uint64 {
	if x != nil {
		return x.OutputEvents
	}
	return 0
}

func (x *MetricsRequest) GetInputEventsByComponent() map[string]uint64 {
	if x != nil {
		return x.InputEventsByComponent
	}
	return nil
}

func (x *MetricsRequest) GetProcessorEventsByComponent() map[string]uint64 {
	if x != nil {
		return x.ProcessorEventsByComponent
	}
	return nil
}

func (x *MetricsRequest) GetOutputEventsByComponent() map[string]uint64 {
	if x != nil {
		return x.OutputEventsByComponent
	}
	return nil
}

type SecretRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Key           string                 `protobuf:"bytes,1,opt,name=key,proto3" json:"key,omitempty"`
	Value         string                 `protobuf:"bytes,2,opt,name=value,proto3" json:"value,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *SecretRequest) Reset() {
	*x = SecretRequest{}
	mi := &file_coordinator_proto_msgTypes[11]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *SecretRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SecretRequest) ProtoMessage() {}

func (x *SecretRequest) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[11]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SecretRequest.ProtoReflect.Descriptor instead.
func (*SecretRequest) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{11}
}

func (x *SecretRequest) GetKey() string {
	if x != nil {
		return x.Key
	}
	return ""
}

func (x *SecretRequest) GetValue() string {
	if x != nil {
		return x.Value
	}
	return ""
}

type ListSecretsResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Data          []*Secret              `protobuf:"bytes,1,rep,name=data,proto3" json:"data,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListSecretsResponse) Reset() {
	*x = ListSecretsResponse{}
	mi := &file_coordinator_proto_msgTypes[12]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListSecretsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListSecretsResponse) ProtoMessage() {}

func (x *ListSecretsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[12]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListSecretsResponse.ProtoReflect.Descriptor instead.
func (*ListSecretsResponse) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{12}
}

func (x *ListSecretsResponse) GetData() []*Secret {
	if x != nil {
		return x.Data
	}
	return nil
}

type SecretResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Data          *Secret                `protobuf:"bytes,1,opt,name=data,proto3" json:"data,omitempty"`
	Meta          *CommonResponse        `protobuf:"bytes,2,opt,name=meta,proto3" json:"meta,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *SecretResponse) Reset() {
	*x = SecretResponse{}
	mi := &file_coordinator_proto_msgTypes[13]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *SecretResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SecretResponse) ProtoMessage() {}

func (x *SecretResponse) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[13]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SecretResponse.ProtoReflect.Descriptor instead.
func (*SecretResponse) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{13}
}

func (x *SecretResponse) GetData() *Secret {
	if x != nil {
		return x.Data
	}
	return nil
}

func (x *SecretResponse) GetMeta() *CommonResponse {
	if x != nil {
		return x.Meta
	}
	return nil
}

type ListWorkersResponse_Worker struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Address       string                 `protobuf:"bytes,2,opt,name=address,proto3" json:"address,omitempty"`
	Status        string                 `protobuf:"bytes,3,opt,name=status,proto3" json:"status,omitempty"`
	LastHeartbeat *timestamppb.Timestamp `protobuf:"bytes,4,opt,name=last_heartbeat,proto3" json:"last_heartbeat,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListWorkersResponse_Worker) Reset() {
	*x = ListWorkersResponse_Worker{}
	mi := &file_coordinator_proto_msgTypes[14]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListWorkersResponse_Worker) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListWorkersResponse_Worker) ProtoMessage() {}

func (x *ListWorkersResponse_Worker) ProtoReflect() protoreflect.Message {
	mi := &file_coordinator_proto_msgTypes[14]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListWorkersResponse_Worker.ProtoReflect.Descriptor instead.
func (*ListWorkersResponse_Worker) Descriptor() ([]byte, []int) {
	return file_coordinator_proto_rawDescGZIP(), []int{4, 0}
}

func (x *ListWorkersResponse_Worker) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *ListWorkersResponse_Worker) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *ListWorkersResponse_Worker) GetStatus() string {
	if x != nil {
		return x.Status
	}
	return ""
}

func (x *ListWorkersResponse_Worker) GetLastHeartbeat() *timestamppb.Timestamp {
	if x != nil {
		return x.LastHeartbeat
	}
	return nil
}

var File_coordinator_proto protoreflect.FileDescriptor

const file_coordinator_proto_rawDesc = "" +
	"\n" +
	"\x11coordinator.proto\x12\vprotorender\x1a\fcommon.proto\x1a\x1cgoogle/api/annotations.proto\x1a\x1bgoogle/protobuf/empty.proto\x1a\x1fgoogle/protobuf/timestamp.proto\x1a\x1cgoogle/protobuf/struct.proto\x1a\x17validate/validate.proto\";\n" +
	"\x15RegisterWorkerRequest\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\x12\x12\n" +
	"\x04port\x18\x02 \x01(\rR\x04port\")\n" +
	"\x17DeregisterWorkerRequest\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\"~\n" +
	"\x19WorkerStreamStatusRequest\x12(\n" +
	"\x10worker_stream_id\x18\x01 \x01(\x03R\x0eworkerStreamId\x127\n" +
	"\x06status\x18\x02 \x01(\x0e2\x1f.protorender.WorkerStreamStatusR\x06status\"J\n" +
	"\x12ListWorkersRequest\x124\n" +
	"\x06status\x18\x01 \x01(\tB\x1c\xfaB\x19r\x17R\x06activeR\binactiveR\x03allR\x06status\"\xe3\x01\n" +
	"\x13ListWorkersResponse\x12;\n" +
	"\x04data\x18\x01 \x03(\v2'.protorender.ListWorkersResponse.WorkerR\x04data\x1a\x8e\x01\n" +
	"\x06Worker\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\x12\x18\n" +
	"\aaddress\x18\x02 \x01(\tR\aaddress\x12\x16\n" +
	"\x06status\x18\x03 \x01(\tR\x06status\x12B\n" +
	"\x0elast_heartbeat\x18\x04 \x01(\v2\x1a.google.protobuf.TimestampR\x0elast_heartbeat\"[\n" +
	"\x12ListStreamsRequest\x12E\n" +
	"\x06status\x18\x01 \x01(\tB-\xfaB*r(R\x06activeR\tcompletedR\x06pausedR\x06failedR\x03allR\x06status\">\n" +
	"\x13ListStreamsResponse\x12'\n" +
	"\x04data\x18\x01 \x03(\v2\x13.protorender.StreamR\x04data\"+\n" +
	"\x10GetStreamRequest\x12\x17\n" +
	"\x02id\x18\x01 \x01(\x03B\a\xfaB\x04\"\x02 \x00R\x02id\"j\n" +
	"\x0eStreamResponse\x12'\n" +
	"\x04data\x18\x01 \x01(\v2\x13.protorender.StreamR\x04data\x12/\n" +
	"\x04meta\x18\x02 \x01(\v2\x1b.protorender.CommonResponseR\x04meta\"\x80\x02\n" +
	"\x05Event\x12(\n" +
	"\x10worker_stream_id\x18\x01 \x01(\x03R\x0eworkerStreamId\x12\x18\n" +
	"\asection\x18\x02 \x01(\tR\asection\x12'\n" +
	"\x0fcomponent_label\x18\x03 \x01(\tR\x0ecomponentLabel\x12C\n" +
	"\x04type\x18\x04 \x01(\tB/\xfaB,r*R\aPRODUCER\aCONSUMER\x06DELETER\x05ERRORR\aUNKNOWNR\x04type\x12\x18\n" +
	"\acontent\x18\x05 \x01(\tR\acontent\x12+\n" +
	"\x04meta\x18\x06 \x01(\v2\x17.google.protobuf.StructR\x04meta\"\x87\x06\n" +
	"\x0eMetricsRequest\x121\n" +
	"\x10worker_stream_id\x18\x01 \x01(\x03B\a\xfaB\x04\"\x02 \x00R\x0eworkerStreamId\x12!\n" +
	"\finput_events\x18\x02 \x01(\x04R\vinputEvents\x12)\n" +
	"\x10processor_errors\x18\x03 \x01(\x04R\x0fprocessorErrors\x12#\n" +
	"\routput_events\x18\x04 \x01(\x04R\foutputEvents\x12r\n" +
	"\x19input_events_by_component\x18\x05 \x03(\v27.protorender.MetricsRequest.InputEventsByComponentEntryR\x16inputEventsByComponent\x12~\n" +
	"\x1dprocessor_events_by_component\x18\x06 \x03(\v2;.protorender.MetricsRequest.ProcessorEventsByComponentEntryR\x1aprocessorEventsByComponent\x12u\n" +
	"\x1aoutput_events_by_component\x18\a \x03(\v28.protorender.MetricsRequest.OutputEventsByComponentEntryR\x17outputEventsByComponent\x1aI\n" +
	"\x1bInputEventsByComponentEntry\x12\x10\n" +
	"\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n" +
	"\x05value\x18\x02 \x01(\x04R\x05value:\x028\x01\x1aM\n" +
	"\x1fProcessorEventsByComponentEntry\x12\x10\n" +
	"\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n" +
	"\x05value\x18\x02 \x01(\x04R\x05value:\x028\x01\x1aJ\n" +
	"\x1cOutputEventsByComponentEntry\x12\x10\n" +
	"\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n" +
	"\x05value\x18\x02 \x01(\x04R\x05value:\x028\x01\"7\n" +
	"\rSecretRequest\x12\x10\n" +
	"\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n" +
	"\x05value\x18\x02 \x01(\tR\x05value\">\n" +
	"\x13ListSecretsResponse\x12'\n" +
	"\x04data\x18\x01 \x03(\v2\x13.protorender.SecretR\x04data\"j\n" +
	"\x0eSecretResponse\x12'\n" +
	"\x04data\x18\x01 \x01(\v2\x13.protorender.SecretR\x04data\x12/\n" +
	"\x04meta\x18\x02 \x01(\v2\x1b.protorender.CommonResponseR\x04meta2\x84\v\n" +
	"\vCoordinator\x12a\n" +
	"\x18UpdateWorkerStreamStatus\x12&.protorender.WorkerStreamStatusRequest\x1a\x1b.protorender.CommonResponse\"\x00\x12S\n" +
	"\x0eRegisterWorker\x12\".protorender.RegisterWorkerRequest\x1a\x1b.protorender.CommonResponse\"\x00\x12W\n" +
	"\x10DeregisterWorker\x12$.protorender.DeregisterWorkerRequest\x1a\x1b.protorender.CommonResponse\"\x00\x12n\n" +
	"\vListWorkers\x12\x1f.protorender.ListWorkersRequest\x1a .protorender.ListWorkersResponse\"\x1c\x82\xd3\xe4\x93\x02\x16\x12\x14/v0/workers/{status}\x12e\n" +
	"\vListStreams\x12\x1f.protorender.ListStreamsRequest\x1a .protorender.ListStreamsResponse\"\x13\x82\xd3\xe4\x93\x02\r\x12\v/v0/streams\x12a\n" +
	"\tGetStream\x12\x1d.protorender.GetStreamRequest\x1a\x1b.protorender.StreamResponse\"\x18\x82\xd3\xe4\x93\x02\x12\x12\x10/v0/streams/{id}\x12X\n" +
	"\fCreateStream\x12\x13.protorender.Stream\x1a\x1b.protorender.StreamResponse\"\x16\x82\xd3\xe4\x93\x02\x10:\x01*\"\v/v0/streams\x12]\n" +
	"\fUpdateStream\x12\x13.protorender.Stream\x1a\x1b.protorender.StreamResponse\"\x1b\x82\xd3\xe4\x93\x02\x15:\x01*\x1a\x10/v0/streams/{id}\x12\\\n" +
	"\vListSecrets\x12\x16.google.protobuf.Empty\x1a .protorender.ListSecretsResponse\"\x13\x82\xd3\xe4\x93\x02\r\x12\v/v0/secrets\x12_\n" +
	"\fCreateSecret\x12\x1a.protorender.SecretRequest\x1a\x1b.protorender.CommonResponse\"\x16\x82\xd3\xe4\x93\x02\x10:\x01*\"\v/v0/secrets\x12e\n" +
	"\fUpdateSecret\x12\x1a.protorender.SecretRequest\x1a\x1b.protorender.CommonResponse\"\x1c\x82\xd3\xe4\x93\x02\x16:\x01*\x1a\x11/v0/secrets/{key}\x12_\n" +
	"\tGetSecret\x12\x1a.protorender.SecretRequest\x1a\x1b.protorender.SecretResponse\"\x19\x82\xd3\xe4\x93\x02\x13\x12\x11/v0/secrets/{key}\x12b\n" +
	"\fDeleteSecret\x12\x1a.protorender.SecretRequest\x1a\x1b.protorender.CommonResponse\"\x19\x82\xd3\xe4\x93\x02\x13*\x11/v0/secrets/{key}\x12>\n" +
	"\fIngestEvents\x12\x12.protorender.Event\x1a\x16.google.protobuf.Empty(\x010\x01\x12F\n" +
	"\rIngestMetrics\x12\x1b.protorender.MetricsRequest\x1a\x16.google.protobuf.Empty\"\x00B4Z2github.com/sananguliyev/airtruct/internal/protogenb\x06proto3"

var (
	file_coordinator_proto_rawDescOnce sync.Once
	file_coordinator_proto_rawDescData []byte
)

func file_coordinator_proto_rawDescGZIP() []byte {
	file_coordinator_proto_rawDescOnce.Do(func() {
		file_coordinator_proto_rawDescData = protoimpl.X.CompressGZIP(unsafe.Slice(unsafe.StringData(file_coordinator_proto_rawDesc), len(file_coordinator_proto_rawDesc)))
	})
	return file_coordinator_proto_rawDescData
}

var file_coordinator_proto_msgTypes = make([]protoimpl.MessageInfo, 18)
var file_coordinator_proto_goTypes = []any{
	(*RegisterWorkerRequest)(nil),      // 0: protorender.RegisterWorkerRequest
	(*DeregisterWorkerRequest)(nil),    // 1: protorender.DeregisterWorkerRequest
	(*WorkerStreamStatusRequest)(nil),  // 2: protorender.WorkerStreamStatusRequest
	(*ListWorkersRequest)(nil),         // 3: protorender.ListWorkersRequest
	(*ListWorkersResponse)(nil),        // 4: protorender.ListWorkersResponse
	(*ListStreamsRequest)(nil),         // 5: protorender.ListStreamsRequest
	(*ListStreamsResponse)(nil),        // 6: protorender.ListStreamsResponse
	(*GetStreamRequest)(nil),           // 7: protorender.GetStreamRequest
	(*StreamResponse)(nil),             // 8: protorender.StreamResponse
	(*Event)(nil),                      // 9: protorender.Event
	(*MetricsRequest)(nil),             // 10: protorender.MetricsRequest
	(*SecretRequest)(nil),              // 11: protorender.SecretRequest
	(*ListSecretsResponse)(nil),        // 12: protorender.ListSecretsResponse
	(*SecretResponse)(nil),             // 13: protorender.SecretResponse
	(*ListWorkersResponse_Worker)(nil), // 14: protorender.ListWorkersResponse.Worker
	nil,                                // 15: protorender.MetricsRequest.InputEventsByComponentEntry
	nil,                                // 16: protorender.MetricsRequest.ProcessorEventsByComponentEntry
	nil,                                // 17: protorender.MetricsRequest.OutputEventsByComponentEntry
	(WorkerStreamStatus)(0),            // 18: protorender.WorkerStreamStatus
	(*Stream)(nil),                     // 19: protorender.Stream
	(*CommonResponse)(nil),             // 20: protorender.CommonResponse
	(*structpb.Struct)(nil),            // 21: google.protobuf.Struct
	(*Secret)(nil),                     // 22: protorender.Secret
	(*timestamppb.Timestamp)(nil),      // 23: google.protobuf.Timestamp
	(*emptypb.Empty)(nil),              // 24: google.protobuf.Empty
}
var file_coordinator_proto_depIdxs = []int32{
	18, // 0: protorender.WorkerStreamStatusRequest.status:type_name -> protorender.WorkerStreamStatus
	14, // 1: protorender.ListWorkersResponse.data:type_name -> protorender.ListWorkersResponse.Worker
	19, // 2: protorender.ListStreamsResponse.data:type_name -> protorender.Stream
	19, // 3: protorender.StreamResponse.data:type_name -> protorender.Stream
	20, // 4: protorender.StreamResponse.meta:type_name -> protorender.CommonResponse
	21, // 5: protorender.Event.meta:type_name -> google.protobuf.Struct
	15, // 6: protorender.MetricsRequest.input_events_by_component:type_name -> protorender.MetricsRequest.InputEventsByComponentEntry
	16, // 7: protorender.MetricsRequest.processor_events_by_component:type_name -> protorender.MetricsRequest.ProcessorEventsByComponentEntry
	17, // 8: protorender.MetricsRequest.output_events_by_component:type_name -> protorender.MetricsRequest.OutputEventsByComponentEntry
	22, // 9: protorender.ListSecretsResponse.data:type_name -> protorender.Secret
	22, // 10: protorender.SecretResponse.data:type_name -> protorender.Secret
	20, // 11: protorender.SecretResponse.meta:type_name -> protorender.CommonResponse
	23, // 12: protorender.ListWorkersResponse.Worker.last_heartbeat:type_name -> google.protobuf.Timestamp
	2,  // 13: protorender.Coordinator.UpdateWorkerStreamStatus:input_type -> protorender.WorkerStreamStatusRequest
	0,  // 14: protorender.Coordinator.RegisterWorker:input_type -> protorender.RegisterWorkerRequest
	1,  // 15: protorender.Coordinator.DeregisterWorker:input_type -> protorender.DeregisterWorkerRequest
	3,  // 16: protorender.Coordinator.ListWorkers:input_type -> protorender.ListWorkersRequest
	5,  // 17: protorender.Coordinator.ListStreams:input_type -> protorender.ListStreamsRequest
	7,  // 18: protorender.Coordinator.GetStream:input_type -> protorender.GetStreamRequest
	19, // 19: protorender.Coordinator.CreateStream:input_type -> protorender.Stream
	19, // 20: protorender.Coordinator.UpdateStream:input_type -> protorender.Stream
	24, // 21: protorender.Coordinator.ListSecrets:input_type -> google.protobuf.Empty
	11, // 22: protorender.Coordinator.CreateSecret:input_type -> protorender.SecretRequest
	11, // 23: protorender.Coordinator.UpdateSecret:input_type -> protorender.SecretRequest
	11, // 24: protorender.Coordinator.GetSecret:input_type -> protorender.SecretRequest
	11, // 25: protorender.Coordinator.DeleteSecret:input_type -> protorender.SecretRequest
	9,  // 26: protorender.Coordinator.IngestEvents:input_type -> protorender.Event
	10, // 27: protorender.Coordinator.IngestMetrics:input_type -> protorender.MetricsRequest
	20, // 28: protorender.Coordinator.UpdateWorkerStreamStatus:output_type -> protorender.CommonResponse
	20, // 29: protorender.Coordinator.RegisterWorker:output_type -> protorender.CommonResponse
	20, // 30: protorender.Coordinator.DeregisterWorker:output_type -> protorender.CommonResponse
	4,  // 31: protorender.Coordinator.ListWorkers:output_type -> protorender.ListWorkersResponse
	6,  // 32: protorender.Coordinator.ListStreams:output_type -> protorender.ListStreamsResponse
	8,  // 33: protorender.Coordinator.GetStream:output_type -> protorender.StreamResponse
	8,  // 34: protorender.Coordinator.CreateStream:output_type -> protorender.StreamResponse
	8,  // 35: protorender.Coordinator.UpdateStream:output_type -> protorender.StreamResponse
	12, // 36: protorender.Coordinator.ListSecrets:output_type -> protorender.ListSecretsResponse
	20, // 37: protorender.Coordinator.CreateSecret:output_type -> protorender.CommonResponse
	20, // 38: protorender.Coordinator.UpdateSecret:output_type -> protorender.CommonResponse
	13, // 39: protorender.Coordinator.GetSecret:output_type -> protorender.SecretResponse
	20, // 40: protorender.Coordinator.DeleteSecret:output_type -> protorender.CommonResponse
	24, // 41: protorender.Coordinator.IngestEvents:output_type -> google.protobuf.Empty
	24, // 42: protorender.Coordinator.IngestMetrics:output_type -> google.protobuf.Empty
	28, // [28:43] is the sub-list for method output_type
	13, // [13:28] is the sub-list for method input_type
	13, // [13:13] is the sub-list for extension type_name
	13, // [13:13] is the sub-list for extension extendee
	0,  // [0:13] is the sub-list for field type_name
}

func init() { file_coordinator_proto_init() }
func file_coordinator_proto_init() {
	if File_coordinator_proto != nil {
		return
	}
	file_common_proto_init()
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: unsafe.Slice(unsafe.StringData(file_coordinator_proto_rawDesc), len(file_coordinator_proto_rawDesc)),
			NumEnums:      0,
			NumMessages:   18,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_coordinator_proto_goTypes,
		DependencyIndexes: file_coordinator_proto_depIdxs,
		MessageInfos:      file_coordinator_proto_msgTypes,
	}.Build()
	File_coordinator_proto = out.File
	file_coordinator_proto_goTypes = nil
	file_coordinator_proto_depIdxs = nil
}
