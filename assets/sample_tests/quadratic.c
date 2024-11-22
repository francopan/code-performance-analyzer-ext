#include <stdio.h>

// Quadratic-time complexity function with nested loops
void quadratic_loop(int n)
{
    int i = 0, j = 0;
    for (i = 0; i < n; i++)
    {
        for (j = 0; j < n; j++)
        {
            int l = 0;
            int k = 0;
            int m = 0;
        }
    }
}

// // Quadratic-time complexity function with array operations
void quadratic_array_operations(int arr[], int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            arr[i] += arr[j]; // Modify elements based on every pair
        }
    }
}

// Quadratic-time complexity function with a condition inside nested loop
void quadratic_with_condition(int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            if (i == j)
            {
                int temp = i + j; // Perform operation only when indices match
            }
        }
    }
}

// // Quadratic-time complexity function with nested loops and arithmetic operations
void quadratic_with_arithmetic(int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            int result = (i + j) * (i - j); // Simple arithmetic
        }
    }
}

// // Quadratic-time complexity function with independent operations in each loop
void quadratic_independent_loops(int n)
{
    for (int i = 0; i < n; i++)
    {
        int x = i * i; // Independent operation in the first loop
    }
    for (int j = 0; j < n; j++)
    {
        int y = j * 2; // Independent operation in the second loop
    }
}

// Main function for testing
int main()
{
    int n;
    printf("Enter a value for n: ");
    scanf("%d", &n);

    int arr[n];
    for (int i = 0; i < n; i++)
    {
        arr[i] = i;
    }

    // Call quadratic-time complexity functions
    quadratic_loop(n);
    quadratic_array_operations(arr, n);
    quadratic_with_condition(n);
    quadratic_with_arithmetic(n);
    quadratic_independent_loops(n);

    return 0;
}
