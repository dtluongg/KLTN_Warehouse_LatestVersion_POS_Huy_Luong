import { axiosClient } from "./axiosClient";

export interface AiSqlChatRow {
    [key: string]: unknown;
}

export interface AiSqlChatResponse {
    question: string;
    sql: string;
    answer?: string;
    summary: string;
    rowCount: number;
    rows: AiSqlChatRow[];
}

export const aiSqlChatApi = {
    ask: async (question: string) => {
        const response = await axiosClient.post<AiSqlChatResponse>(
            "/ai/sql-chat",
            { question },
            { timeout: 90000 },
        );
        return response.data;
    },
};
