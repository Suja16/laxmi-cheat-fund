import { ethers } from 'ethers';

/**
 * Ethers compatibility layer for v6
 * Provides consistent interface for ethers v6 functionality
 */
export const ethersCompat = {
    /**
     * Create a contract instance
     */
    getContract(address: string, abi: any[], provider: any) {
        return new ethers.Contract(address, abi, provider);
    },

    /**
     * Parse units (convert human readable to wei)
     */
    parseUnits(value: string, decimals: number): bigint {
        return ethers.parseUnits(value, decimals);
    },

    /**
     * Format units (convert wei to human readable)
     */
    formatUnits(value: bigint | string, decimals: number): string {
        return ethers.formatUnits(value, decimals);
    },

    /**
     * Check if address is valid
     */
    isAddress(address: string): boolean {
        return ethers.isAddress(address);
    },

    /**
     * Get address from wallet
     */
    async getAddress(signer: any): Promise<string> {
        return await signer.getAddress();
    }
};
