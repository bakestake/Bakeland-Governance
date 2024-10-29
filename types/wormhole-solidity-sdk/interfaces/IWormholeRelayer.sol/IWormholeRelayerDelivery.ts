/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../../../common";

export interface IWormholeRelayerDeliveryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "deliver"
      | "deliveryAttempted"
      | "deliveryFailureBlock"
      | "deliverySuccessBlock"
      | "getRegisteredWormholeRelayerContract"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "Delivery" | "SendEvent"): EventFragment;

  encodeFunctionData(
    functionFragment: "deliver",
    values: [BytesLike[], BytesLike, AddressLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "deliveryAttempted",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "deliveryFailureBlock",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "deliverySuccessBlock",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRegisteredWormholeRelayerContract",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "deliver", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "deliveryAttempted",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deliveryFailureBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deliverySuccessBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRegisteredWormholeRelayerContract",
    data: BytesLike
  ): Result;
}

export namespace DeliveryEvent {
  export type InputTuple = [
    recipientContract: AddressLike,
    sourceChain: BigNumberish,
    sequence: BigNumberish,
    deliveryVaaHash: BytesLike,
    status: BigNumberish,
    gasUsed: BigNumberish,
    refundStatus: BigNumberish,
    additionalStatusInfo: BytesLike,
    overridesInfo: BytesLike
  ];
  export type OutputTuple = [
    recipientContract: string,
    sourceChain: bigint,
    sequence: bigint,
    deliveryVaaHash: string,
    status: bigint,
    gasUsed: bigint,
    refundStatus: bigint,
    additionalStatusInfo: string,
    overridesInfo: string
  ];
  export interface OutputObject {
    recipientContract: string;
    sourceChain: bigint;
    sequence: bigint;
    deliveryVaaHash: string;
    status: bigint;
    gasUsed: bigint;
    refundStatus: bigint;
    additionalStatusInfo: string;
    overridesInfo: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace SendEventEvent {
  export type InputTuple = [
    sequence: BigNumberish,
    deliveryQuote: BigNumberish,
    paymentForExtraReceiverValue: BigNumberish
  ];
  export type OutputTuple = [
    sequence: bigint,
    deliveryQuote: bigint,
    paymentForExtraReceiverValue: bigint
  ];
  export interface OutputObject {
    sequence: bigint;
    deliveryQuote: bigint;
    paymentForExtraReceiverValue: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface IWormholeRelayerDelivery extends BaseContract {
  connect(runner?: ContractRunner | null): IWormholeRelayerDelivery;
  waitForDeployment(): Promise<this>;

  interface: IWormholeRelayerDeliveryInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  deliver: TypedContractMethod<
    [
      encodedVMs: BytesLike[],
      encodedDeliveryVAA: BytesLike,
      relayerRefundAddress: AddressLike,
      deliveryOverrides: BytesLike
    ],
    [void],
    "payable"
  >;

  deliveryAttempted: TypedContractMethod<
    [deliveryHash: BytesLike],
    [boolean],
    "view"
  >;

  deliveryFailureBlock: TypedContractMethod<
    [deliveryHash: BytesLike],
    [bigint],
    "view"
  >;

  deliverySuccessBlock: TypedContractMethod<
    [deliveryHash: BytesLike],
    [bigint],
    "view"
  >;

  getRegisteredWormholeRelayerContract: TypedContractMethod<
    [chainId: BigNumberish],
    [string],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "deliver"
  ): TypedContractMethod<
    [
      encodedVMs: BytesLike[],
      encodedDeliveryVAA: BytesLike,
      relayerRefundAddress: AddressLike,
      deliveryOverrides: BytesLike
    ],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "deliveryAttempted"
  ): TypedContractMethod<[deliveryHash: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "deliveryFailureBlock"
  ): TypedContractMethod<[deliveryHash: BytesLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "deliverySuccessBlock"
  ): TypedContractMethod<[deliveryHash: BytesLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "getRegisteredWormholeRelayerContract"
  ): TypedContractMethod<[chainId: BigNumberish], [string], "view">;

  getEvent(
    key: "Delivery"
  ): TypedContractEvent<
    DeliveryEvent.InputTuple,
    DeliveryEvent.OutputTuple,
    DeliveryEvent.OutputObject
  >;
  getEvent(
    key: "SendEvent"
  ): TypedContractEvent<
    SendEventEvent.InputTuple,
    SendEventEvent.OutputTuple,
    SendEventEvent.OutputObject
  >;

  filters: {
    "Delivery(address,uint16,uint64,bytes32,uint8,uint256,uint8,bytes,bytes)": TypedContractEvent<
      DeliveryEvent.InputTuple,
      DeliveryEvent.OutputTuple,
      DeliveryEvent.OutputObject
    >;
    Delivery: TypedContractEvent<
      DeliveryEvent.InputTuple,
      DeliveryEvent.OutputTuple,
      DeliveryEvent.OutputObject
    >;

    "SendEvent(uint64,uint256,uint256)": TypedContractEvent<
      SendEventEvent.InputTuple,
      SendEventEvent.OutputTuple,
      SendEventEvent.OutputObject
    >;
    SendEvent: TypedContractEvent<
      SendEventEvent.InputTuple,
      SendEventEvent.OutputTuple,
      SendEventEvent.OutputObject
    >;
  };
}