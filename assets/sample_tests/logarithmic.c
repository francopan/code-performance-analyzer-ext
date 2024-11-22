#include <stdio.h>

// Logarithmic-time complexity function (Doubling each step)
void logarithmic_loop(int n)
{
    int i = 1;
    while (i < n)
    {
        i *= 2; // Doubling each step
    }
}

// // Logarithmic-time complexity function using recursion
void logarithmic_recursive(int n)
{
    if (n <= 1)
        return;
    logarithmic_recursive(n / 2); // Halving each step
}

// // Logarithmic-time complexity function with a binary search pattern
int binary_search(int arr[], int left, int right, int target)
{
    if (left > right)
        return -1; // Element not found

    int mid = left + (right - left) / 2;

    if (arr[mid] == target)
        return mid;
    else if (arr[mid] > target)
        return binary_search(arr, left, mid - 1, target);
    else
        return binary_search(arr, mid + 1, right, target);
}

// // Logarithmic-time complexity function with nested loops (log(n) * log(n))
void logarithmic_nested_loops(int n)
{
    int i = 1;
    while (i < n)
    {
        int j = 1;
        while (j < n)
        {
            j *= 2; // Doubling each step
        }
        i *= 2; // Doubling each step
    }
}

// Main function for testing
int main()
{
    int n;
    printf("Enter a value for n: ");
    scanf("%d", &n);

    //    Call logarithmic-time complexity functions
    logarithmic_loop(n);
    logarithmic_recursive(n);

    //    Example array for binary search
    int arr[] = {1, 3, 5, 7, 9, 11, 13, 15, 17};
    int target = 7;
    int result = binary_search(arr, 0, sizeof(arr) / sizeof(arr[0]) - 1, target);
    if (result != -1)
        printf("Element %d found at index %d\n", target, result);
    else
        printf("Element %d not found\n", target);

    logarithmic_nested_loops(n);

    return 0;
}
