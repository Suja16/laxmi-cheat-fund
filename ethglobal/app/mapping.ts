import type { Mapping } from '@graphprotocol/hypergraph';
import { Id } from '@graphprotocol/hypergraph';

export const mapping: Mapping.Mapping = {
  Image: {
    typeIds: [Id('ba4e4146-0010-499d-a0a3-caaa7f579d0e')],
    properties: {
      url: Id('8a743832-c094-4a62-b665-0c3cc2f9c7bc'),
    },
  },
  Project: {
    typeIds: [Id('484a18c5-030a-499c-b0f2-ef588ff16d50')],
    properties: {
      name: Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
      description: Id('9b1f76ff-9711-404c-861e-59dc3fa7d037'),
      xUrl: Id('0d625978-4b3c-4b57-a86f-de45c997c73c'),
    },
    relations: {
      avatar: Id('1155beff-fad5-49b7-a2e0-da4777b8792c'),
    },
  },
  Dapp: {
    typeIds: [Id('8ca136d0-698a-4bbf-a76b-8e2741b2dc8c')],
    properties: {
      name: Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
      description: Id('9b1f76ff-9711-404c-861e-59dc3fa7d037'),
      xUrl: Id('0d625978-4b3c-4b57-a86f-de45c997c73c'),
      githubUrl: Id('9eedefa8-60ae-4ac1-9a04-805054a4b094'),
    },
    relations: {
      avatar: Id('1155beff-fad5-49b7-a2e0-da4777b8792c'),
    },
  },
  Investor: {
    typeIds: [Id('331aea18-973c-4adc-8f53-614f598d262d')],
    properties: {
      name: Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
    },
  },
  FundingStage: {
    typeIds: [Id('8d35d217-3fa1-4686-b74f-fcb3e9438067')],
    properties: {
      name: Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
    },
  },
  InvestmentRound: {
    typeIds: [Id('8f03f4c9-59e4-44a8-a625-c0a40b1ff330')],
    properties: {
      name: Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
      raisedAmount: Id('16781706-dd9c-48bf-913e-cdf18b56034f'),
    },
    relations: {
      investors: Id('9b8a610a-fa35-486e-a479-e253dbdabb4f'),
      fundingStages: Id('e278c3d4-78b9-4222-b272-5a39a8556bd2'),
      raisedBy: Id('b4878d1a-0609-488d-b8a6-e19862d6b62f'),
    },
  },
  Asset: {
    typeIds: [Id('f8780a80-c238-4a2a-96cb-567d88b1aa63')],
    properties: {
      name: Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
      symbol: Id('ace1e96c-9b83-47b4-bd33-1d302ec0a0f5'),
      blockchainAddress: Id('56b5944f-f059-48d1-b0fa-34abe84219da'),
    },
  },
  ContractTransaction: {
    typeIds: [Id('d559286e-dd31-4de4-bf42-855d6084f0bc')],
    properties: {
      transactionHash: Id('3da9b0ee-deba-4508-a8af-3825ceb28e56'),
      blockNumber: Id('e2b089af-7219-4ea7-b351-51242423df5b'),
      blockTimestamp: Id('80accce5-1b3f-4933-a3df-f4ad1c033454'),
      from: Id('9c48709e-553b-4ff3-afff-5b1b9e4b8379'),
      to: Id('4dc34634-5db0-46d7-baf0-3f5e43d946f7'),
      value: Id('2ddcdeab-d248-4f0a-9ca5-970f5120e068'),
      gasUsed: Id('a262005e-2bb8-4261-b74d-0cdf79f94512'),
      gasPrice: Id('c7e4098f-3660-4f5d-a397-428986a49539'),
      methodName: Id('adc05fe4-e79c-4516-9a6d-a7e6ebe7cea6'),
      methodId: Id('fdf1c5ce-b886-4174-b5e8-a677324cceb2'),
      status: Id('69e5f91a-ff15-4b53-8240-46f6016a1fe9'),
      contractAddress: Id('280eef87-4204-4a80-befa-e56079c8b561'),
      inputData: Id('de60f40d-1ece-4075-a881-db961d1eb91f'),
      logs: Id('7616312d-9506-4642-baef-492816070ae7'),
    },
  },
  ContractEvent: {
    typeIds: [Id('7f0c2420-5b3c-4a8a-9213-b1808738f0d9')],
    properties: {
      eventName: Id('4da5fa59-6250-40fd-b9bf-f154f6dce7d0'),
      eventSignature: Id('0cf0bf93-7e31-48b6-bb69-a1bb8066a8d0'),
      transactionHash: Id('9a3d30a9-1690-43f7-84c9-15f83081d806'),
      blockNumber: Id('77dc4c8d-7c3d-4cef-ab82-78cd3f3394ee'),
      blockTimestamp: Id('3ce1a2b2-0feb-40d4-9ef4-b00871505022'),
      logIndex: Id('9045ca27-4173-41a3-892a-41cba5b0eb54'),
      contractAddress: Id('e850d5fa-249f-4753-af9f-8b8359af9a05'),
      topics: Id('4f793564-049a-4e9e-81cc-1206df9413bc'),
      data: Id('fc487f33-3a4d-470c-8ab6-8cea029a491d'),
      decodedData: Id('ca6eaa4e-11f0-431b-aa9f-90ce3ecf686f'),
    },
  },
  ContractState: {
    typeIds: [Id('f2c9a090-eba9-46b4-a4da-e02e11a42b6a')],
    properties: {
      contractAddress: Id('0e4d92c7-1397-49f7-9035-9ecf3b3a0f95'),
      blockNumber: Id('4f2e7be1-86b0-470e-b356-e1ef4e5094d9'),
      blockTimestamp: Id('592cb32e-2c32-40e3-b047-12c2c642dff0'),
      stateKey: Id('c8d251fb-444a-4c98-900a-6eb4e4886c85'),
      stateValue: Id('3679403b-3faf-4092-85e4-30ed0f069e8d'),
      stateType: Id('812f7d70-1ca4-413f-85f2-bc5134cd7ef9'),
    },
  },
  UserInteraction: {
    typeIds: [Id('bbc62844-d960-481b-a509-0a9a035f1652')],
    properties: {
      userAddress: Id('7dec3e92-2684-4d2f-8bf9-83c35e3469c2'),
      transactionHash: Id('23a4d208-0e6b-4d0f-a3c9-d85b394e5a73'),
      blockNumber: Id('9764938b-85ef-41f9-ac9f-d69b562afb1d'),
      blockTimestamp: Id('7616312d-9506-4642-baef-492816070ae7'),
      interactionType: Id('478ce176-8ca4-4901-8594-5c621fc84db7'),
      amount: Id('8e4c9510-6d4c-45fb-bc03-2a1df3a24290'),
      tokenAddress: Id('de60f40d-1ece-4075-a881-db961d1eb91f'),
      contractAddress: Id('ca55aa89-7156-435f-8ea2-b988649d6164'),
      methodName: Id('448390e8-78ba-4307-ac01-00a73f811cf7'),
      success: Id('280eef87-4204-4a80-befa-e56079c8b561'),
      gasUsed: Id('adc05fe4-e79c-4516-9a6d-a7e6ebe7cea6'),
    },
  },
};
