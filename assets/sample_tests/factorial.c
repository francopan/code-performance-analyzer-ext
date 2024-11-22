#include <stdio.h>

// Factorial-time complexity function using recursion
int factorial(int n)
{
    if (n <= 1)
        return 1;
    return n * factorial(n - 1);
}

// Factorial-time complexity function using iteration
int factorial_iterative(int n)
{
    int result = 1;
    int i = 1;
    for (i = 1; i <= n; i++)
    {
        result *= i;
    }
    return result;
}

// // Factorial-time complexity function with memoization
int memo[1000]; // Memoization array to store intermediate results
int factorial_memo(int n)
{
    if (n <= 1)
        return 1;
    if (memo[n] != 0)
        return memo[n];
    memo[n] = n * factorial_memo(n - 1);
    return memo[n];
}

// Factorial-time complexity function with tail recursion
int factorial_tail_recursive(int n, int accumulator)
{
    if (n <= 1)
        return accumulator;
    return factorial_tail_recursive(n - 1, n * accumulator);
}

// // Factorial-time complexity function with dynamic programming
int factorial_dynamic(int n)
{
    int dp[n + 1];
    dp[0] = 1;
    for (int i = 1; i <= n; i++)
    {
        dp[i] = dp[i - 1] * i;
    }
    return dp[n];
}

// Main function for testing
int main()
{
    int n;
    printf("Enter a value for n: ");
    scanf("%d", &n);

    // Call factorial-time complexity functions
    printf("Factorial of %d using recursion is %d\n", n, factorial(n));
    printf("Factorial of %d using iteration is %d\n", n, factorial_iterative(n));
    printf("Factorial of %d using memoization is %d\n", n, factorial_memo(n));
    printf("Factorial of %d using tail recursion is %d\n", n, factorial_tail_recursive(n, 1));
    printf("Factorial of %d using dynamic programming is %d\n", n, factorial_dynamic(n));

    return 0;
}
