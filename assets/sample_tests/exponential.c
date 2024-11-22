#include <stdio.h>

// Exponential-time complexity function with nested loops and bitwise operations
void exponential_loop(int n)
{
    int total_subsets = 1 << n; // 2^n

    for (int i = 0; i < total_subsets; i++)
    {
        for (int j = 0; j < n; j++)
        {
            if (i & (1 << j)) // Check if the j-th bit is set in i
                printf("%d ", j);
        }
        printf("\n");
    }
}

// Exponential-time complexity function generating all possible subsets
void exponential_subsets(int n)
{
    int total_subsets = 1 << n; // 2^n

    for (int i = 0; i < total_subsets; i++)
    {
        printf("{ ");
        for (int j = 0; j < n; j++)
        {
            if (i & (1 << j)) // Check if the j-th bit is set in i
                printf("%d ", j);
        }
        printf("}\n");
    }
}

// Exponential-time complexity function with a recursive approach
void exponential_recursive(int n, int current)
{
    if (current == n)
    {
        return;
    }

    // Do some operation with current
    printf("%d ", current);

    // Recurse for both cases (include or exclude current)
    exponential_recursive(n, current + 1);
    exponential_recursive(n, current + 1);
}

// // Exponential-time complexity function generating all combinations of a string
void exponential_string_combinations(const char *str, int index, int n)
{
    if (index == n)
    {
        return;
    }

    // Print string up to the current index
    for (int i = 0; i < (1 << index); i++)
    {
        printf("%c", str[i]);
    }
    printf("\n");

    // Recurse for the next index
    exponential_string_combinations(str, index + 1, n);
}

// Exponential-time complexity function performing recursive backtracking
void exponential_backtracking(int n, int current)
{
    if (current == n)
    {
        return;
    }

    // Do some operation (e.g., print current)
    printf("%d ", current);

    // Explore with current choice
    exponential_backtracking(n, current + 1);

    // Backtrack (undo the current choice)
    exponential_backtracking(n, current + 1);
}

// Main function for testing
int main()
{
    int n;
    printf("Enter a value for n: ");
    scanf("%d", &n);

    // Call exponential-time complexity functions
    exponential_loop(n);
    exponential_subsets(n);
    exponential_recursive(n, 0);

    const char *str = "ABCDE";
    exponential_string_combinations(str, 0, 5);

    exponential_backtracking(n, 0);

    return 0;
}
