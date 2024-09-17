export const prompts = {
    analyzeCode: `Code: \`\`\`c\n{{code}}\n\`\`\`
        Analyze the code for its time complexity in Big O notation.
        IN ORDER FOR ME TO PARSE THE RESULT, RETURN A JSON OBJECT WITH KEYS "bigO" AND "message". USE "message" FOR ANY EXPLANATION OR ERROR, BUT DO NOT INCLUDE ANY OTHER TEXT BEFORE OR AFTER THE JSON.

        Expected result format:

        {
            "bigO": "O(n^2)",
            "message": "Explanation of the time complexity"
        }

        OR

        {
            "bigO": null,
            "message": "Explanation of the reason why cannot give complexity"
        }`,
};